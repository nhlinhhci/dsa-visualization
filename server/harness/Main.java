public class Main {
  // Tracer đọc mảng qua field này sau mỗi dòng code.
  static int[] data;

  // args: <target> <giá trị mảng...>
  public static void main(String[] args) {
    int target = Integer.parseInt(args[0]);
    data = new int[args.length - 1];
    for (int i = 1; i < args.length; i++) data[i - 1] = Integer.parseInt(args[i]);
    // Runner thay dòng dưới bằng lời gọi hàm của sinh viên.
    /*DSA_CALL*/
  }
}
