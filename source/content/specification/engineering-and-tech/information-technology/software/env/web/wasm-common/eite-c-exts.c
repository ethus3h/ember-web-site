#include "_eite-shared.c"
/*#include <stdlib.h>
*/
/* void _start() {
    utf8enc();
    utf9enc();
}
extern int utf8enc(); */
/*
EXPORT void * __attribute__((noinline)) _malloc(size_t size) {
    return malloc(size);
}
EXPORT void __attribute__((noinline)) _free(void *ptr) {
    free(ptr);
}*/
EXPORT int fortytwo(int a) {
    return 42;
}
EXPORT int add(int a, int b) {
    return a+b;
}
EXPORT int utf8enc() {
    return 44;
}
EXPORT int utf9enc() {
    return 43;
}
