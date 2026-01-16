pragma circom 2.0.0;

template Test() {
    signal input a;
    signal input private b;
    signal output out;
    out <== a + b;
}

component main = Test();
