#include <stdint.h>
void main(void) {
    volatile long *delay = (volatile long *)0x10000000;
    while (1) {
        *delay = 'X';
        *delay = 'Y';
        *delay = 'Z';
    }
}
