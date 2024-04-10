---
title: "使用 FST 做分词器"
date: 2021-04-14T14:09:03+08:00
draft: true
tags: ["analyzer","fst"]
categories: ["lucene"]
---

# 场景

在分词器的使用中，主要就是字典如何构建，能够达到空间和时间的最优化，常用的字典数据结构：

| 数据结构                       | 优缺点                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| 排序列表Array/List             | 使用二分法查找，不平衡                                       |
| HashMap/TreeMap                | 性能高，内存消耗大，几乎是原始数据的三倍                     |
| Skip List                      | 跳跃表，可快速查找词语，在lucene、redis、Hbase等均有实现。相对于TreeMap等结构，特别适合高并发场景（[Skip List介绍](http://kenby.iteye.com/blog/1187303)） |
| Trie                           | 适合英文词典，如果系统中存在大量字符串且这些字符串基本没有公共前缀，则相应的trie树将非常消耗内存（[数据结构之trie树](http://dongxicheng.org/structure/trietree/)） |
| Double Array Trie              | 适合做中文词典，内存占用小，很多分词工具均采用此种算法（[深入双数组Trie](http://blog.csdn.net/zhoubl668/article/details/6957830)） |
| Ternary Search Tree            | 三叉树，每一个node有3个节点，兼具省空间和查询快的优点（[Ternary Search Tree](http://www.drdobbs.com/database/ternary-search-trees/184410528)） |
| Finite State Transducers (FST) | 一种有限状态转移机，Lucene 4有开源实现，并大量使用           |

而我们在词典的实现上，也经历过了几个阶段：

1. 使用``Map``去实现，优点是可以动态增删，但是占用空间极大，随着后期我们词典数量的增加，更是达到了10GB 以上，基本无法再使用；
2. 使用``Double Array Trie``，优点是进行了压缩，空间占用提升巨大，同样的词典，比``Map``节省 8 倍左右；缺点也很明显，无法动态增删，只能提前构建，而且构建时间长，达到几分钟；

后面有看到``Lucene``的倒排索引实现，使用的 FST，就想着，本身倒排就是找词，是不是可以用到分词上来。于是就开搞：

# 初步测试

因为``Lucene``本身就开源了``FST``的实现，就只能可以拿来用了。

首先就是先测试一下整个词典加载速度、空间占用，这里我一共是 1600万 的词典。因为``FST``只能接收字典序的词，所以在构建时，先用``TreeSet``排序，然后再进行``FST``的添加。

整个构建过程，由于有``TreeSet``作为中间处理，占用还是 1GB 左右，构建完成后，把``TreeSet``GC后，就只有 150MB 左右了。同时，把``FST``保存为文件后，也只有 150MB 了。空间上又提升了 8倍 以上，Good~

整个构建过程也是秒级，基本上40秒可以构建完，这里比``DAT``又是提升 N倍；

在加载速度、空间占用上，``FST``完全满足需要了。就剩实际功能的测试了

# 完整测试

在完整测试上，主要是测试通过``FST``是否可以构建一个字符串的``DAG(有向无环图)``，因为我们分词器分为了很多个子分词器（如：英语、西语、藏语），每个子分词器都是构建出当前串的``DAG``，然后进行合并，最后通过``DAG``和词频，计算最大成词，就是最终结果了。

首先，我们通过构建一个简单``FST``进行测试：

```java
    private FST<Long> buildFST() {
        TreeSet<String> set = new TreeSet<>();
        set.add("中国");
        set.add("中国人");
        set.add("中国人民");
        set.add("中国人民共和国");
        set.add("国人");
        set.add("国足");
        set.add("足球");

        PositiveIntOutputs outputs = PositiveIntOutputs.getSingleton();
        Builder<Long> builder = new Builder<>(FST.INPUT_TYPE.BYTE1, outputs);
        IntsRefBuilder intsRef = new IntsRefBuilder();
        long count = 1;
        for (String s : set) {
            builder.add(Util.toIntsRef(new BytesRef(s), intsRef), count++);
        }
        FST<Long> fst = builder.finish();
        return fst;
    }
```

查找一个词是否存在于词典，有现成的方法可以用：

```java
Long aLong = Util.get(fst, new BytesRef("中国"));
System.out.println(aLong);
```

但这个并不能够满足我们的需要，实际上我们的需求是：

```
输入：中国的国足谈不上足球
输出：{0=[2], 3=[2], 8=[2]}
通过输出结果，可以看到实际的分词结果是：中国、国足、足球
```

## 分析 FST

首先，我们可以看一下``Util.get()``这个方法：

```java
  /** Looks up the output for this input, or null if the
   *  input is not accepted */
  public static<T> T get(FST<T> fst, BytesRef input) throws IOException {
    assert fst.inputType == FST.INPUT_TYPE.BYTE1;

    final BytesReader fstReader = fst.getBytesReader();

    // TODO: would be nice not to alloc this on every lookup
    final FST.Arc<T> arc = fst.getFirstArc(new FST.Arc<T>());

    // Accumulate output as we go
    T output = fst.outputs.getNoOutput();
      // 从开始位置往后依次遍历并查找
    for(int i=0;i<input.length;i++) {
        // 寻找当前 input 是否存在一个边
      if (fst.findTargetArc(input.bytes[i+input.offset] & 0xFF, arc, arc, fstReader) == null) {
          // 不存在边，则返回 null
        return null;
      }
      output = fst.outputs.add(output, arc.output);
    }

      // 如果边是结束状态，则找到了对应的词，即可返回
    if (arc.isFinal()) {
      return fst.outputs.add(output, arc.nextFinalOutput);
    } else {
        // 没有找到结束状态，返回 null
      return null;
    }
  }
```

可以看到，这个地方只能返回一个状态，比如我输入是”中国国足“，就会返回null，因为词典里面不存在这个词。但实际上，它是存在”中国“和”国足“的。拿有没有办法拿到呢？我们先试着改一下：

```java
    public static <T> T getPre(FST<T> fst, BytesRef input) throws IOException {
        assert fst.inputType == FST.INPUT_TYPE.BYTE1;

        final FST.BytesReader fstReader = fst.getBytesReader();

        // TODO: would be nice not to alloc this on every lookup
        final FST.Arc<T> arc = fst.getFirstArc(new FST.Arc<T>());

        // 添加一个 list 存放结果
        List<Integer> list = new ArrayList<>();

        // Accumulate output as we go
        T output = fst.outputs.getNoOutput();
        for (int i = 0; i < input.length; i++) {
            if (fst.findTargetArc(input.bytes[i + input.offset] & 0xFF, arc, arc, fstReader) == null) {
                // 因为需要最终输出，所以这里不能直接返回，用 break；
                //return null;
                break;
            }
            output = fst.outputs.add(output, arc.output);
            // 如果当前这个边，是一个结束状态，就添加到数组
            if (arc.isFinal()) {
                list.add(i);
            }
        }

        // 输入数组，调试
        System.out.println(list);

        if (arc.isFinal()) {
            return fst.outputs.add(output, arc.nextFinalOutput);
        } else {
            return null;
        }
    }
```

我们尝试一下查找：

```java
Long res = getPre(fst, new BytesRef("中国的国足"));
```

这个``list`` 的输出为：``[5]``，虽然有数据，但这个``5``就很疑惑。我们先看一下``ByteRef``这个类：

```java
  /**
   * Initialize the byte[] from the UTF8 bytes
   * for the provided String.  
   * 
   * @param text This must be well-formed
   * unicode text, with no unpaired surrogates.
   */
  public BytesRef(CharSequence text) {
    this(new byte[UnicodeUtil.maxUTF8Length(text.length())]);
    length = UnicodeUtil.UTF16toUTF8(text, 0, text.length(), bytes);
  }
```

实际上，传入的字符串，会被转成``byte[]``，并且是``UTF8``的类型。那我们拿到的``index``即``5``，也是``byte[]``中的，需要进行转换：

```java
        List<Integer> res = new ArrayList<>();
        for (Integer integer : list) {
            final char[] ref = new char[input.length];
            final int len = UnicodeUtil.UTF8toUTF16(input.bytes, 0, integer, ref);
            res.add(len);
        }
        System.out.println(res);
```

再跑一次，这回这个``res``就是``[2]``，即：中国，结果就是对的了。当然，这个时候怎么体现一个词，能够查出来多个组合呢？让我们添加一个词：中国的：

```java
set.add("中国的");
```

再来一次，``res``的结果为：``[2, 3]``，即：中国、中国的。

这个时候，我们已经实现了``DAG``中一小步，从``0``开始的对应关系我们已经可以拿到了：``{0=[2,3]}``。但是后面的又该怎么弄呢？

## 实现 DAG

实际上，``DAG``就是以每个字为开头，依次进行一次匹配，就可以拿到类似：``{0=[],1=[],2=[],3=[]}``这样的结果，那我们可以再改造一下代码：

```java
String data = "中国的国足";
for (int i = 0; i < data.length(); i++) {
    Long res = getPre(fst, new BytesRef(data.substring(i)));
}
```

可以看到这个时候的``res``结果会输出两次，分别为：``[2, 3]``和``[2]``，可以看到对应的就是：中国、中国的、国足，三个词。接下来，只需要把关系对应起来就好了：

首先，把``FST``的结果进行返回：

```java
    public static <T> T getPre(FST<T> fst, BytesRef input, List<Integer> res) throws IOException {
        assert fst.inputType == FST.INPUT_TYPE.BYTE1;

        final FST.BytesReader fstReader = fst.getBytesReader();

        // TODO: would be nice not to alloc this on every lookup
        final FST.Arc<T> arc = fst.getFirstArc(new FST.Arc<T>());

        // 添加一个 list 存放结果
        List<Integer> list = new ArrayList<>();

        // Accumulate output as we go
        T output = fst.outputs.getNoOutput();
        for (int i = 0; i < input.length; i++) {
            if (fst.findTargetArc(input.bytes[i + input.offset] & 0xFF, arc, arc, fstReader) == null) {
                // 因为需要最终输出，所以这里不能直接返回，用 break；
                //return null;
                break;
            }
            output = fst.outputs.add(output, arc.output);
            // 如果当前这个边，是一个结束状态，就添加到数组
            if (arc.isFinal()) {
                list.add(i);
            }
        }

        // 输入数组，调试
//        System.out.println(list);

        for (Integer integer : list) {
            final char[] ref = new char[input.length];
            final int len = UnicodeUtil.UTF8toUTF16(input.bytes, 0, integer, ref);
            res.add(len);
        }

        if (arc.isFinal()) {
            return fst.outputs.add(output, arc.nextFinalOutput);
        } else {
            return null;
        }
    }
```

然后，在外面把结果对应起来：

```java
FST<Long> fst = buildFST();
String data = "中国的国足";
Map<Integer, List<Integer>> dag = new HashMap<>();
for (int i = 0; i < data.length(); i++) {
    List<Integer> list = new ArrayList<>();
    Long res = getPre(fst, new BytesRef(data.substring(i)), list);
    if (!list.isEmpty()) {
        dag.put(i, list);
    }
}
System.out.println(dag);
```

输出结果为：

```
{0=[2, 3], 3=[2]}
```

可以看到这个结果是正确的。再试一下一开始的用例：

```
输入：中国的国足谈不上足球
输出：{0=[2, 3], 3=[2], 8=[2]}
可以看到，结果是一致，因为中途我们加了“中国的”这个词，所以0开头的图，就变成了[2,3],表示有两个结尾
```

# 优化

在功能测试完成后，基本上满足了我们的需求了，但还是有些地方可以做一下优化

## 字符串截取优化

```java
for (int i = 0; i < data.length(); i++) {
    List<Integer> list = new ArrayList<>();
    //这里的 data.substring(i),因为每次都会 new String(),在数据量大的场景中，会存在溢出风险
    Long res = getPre(fst, new BytesRef(data.substring(i)), list);
    if (!list.isEmpty()) {
        dag.put(i, list);
    }
}
```

我们前面也看到了``ByteRef``实际上是用的``byte[]``存储的，它也可以直接传入``byte[]``，我们这里考虑直接传入``byte[]``，并且在外面使用``char[]``进行遍历：

```java
        String data = "中国的国足";
        char[] chars = data.toCharArray();
        for (int i = 0; i < chars.length; i++) {
            List<Integer> list = new ArrayList<>();
            byte[] req = new byte[UnicodeUtil.maxUTF8Length(chars.length)];
            UnicodeUtil.UTF16toUTF8(chars, i, chars.length - i, req);
            Long res = getPre(fst, new BytesRef(req), list);
            if (!list.isEmpty()) {
                dag.put(i, list);
            }
        }
```

这里，我们就移除掉了``substring()``，直接使用``char[]``，提升效率及优化内存使用。

# 总结

经过几天的学习，从一开始的想法，到分析代码，最终落实到具体的程序。与之前的``DAT``相比，``FST``在内存占用上基本少了8倍，构建速度提升N倍，查询效率上，小文本基本没差距；大文本比``DAT``慢一倍；权衡查询效率和空间占用，我们还是决定使用``FST``实现一版分词器，因为词典的不断增大，使用会面临内存占用和构建速度的问题。

# 参考

https://www.shenyanchao.cn/blog/2018/12/04/lucene-fst/

https://www.cnblogs.com/bonelee/p/6226185.html