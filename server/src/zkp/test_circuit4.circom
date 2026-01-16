pragma circom 2.0.0;

template Example() {
    signal input in;
    signal output out;
    out <== in;
}

component main = Example();
