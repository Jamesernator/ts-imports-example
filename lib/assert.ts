export default function assert(cond: boolean): asserts cond {
    if (!cond) {
        throw new Error(`assertion failed`);
    }
}
