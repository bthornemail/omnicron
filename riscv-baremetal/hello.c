void main(void) {
    volatile unsigned long *uart = (volatile unsigned long *)0x10000000;
    while (1) {
        *uart = 'H';
        for (volatile int i = 0; i < 10000; i++);
    }
}
