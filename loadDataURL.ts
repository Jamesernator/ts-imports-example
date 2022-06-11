import assert from "./lib/assert.js";
import Base64 from "#base64";

export default function loadDataURL(url: string): Blob {
    const u = new URL(url);
    if (u.protocol !== "data:") {
        throw new RangeError(`not a data: url`);
    }
    const [firstSegment, ...rest] = u.pathname.split(",");
    assert(firstSegment !== undefined);
    const data = rest.join(",");
    const [contentType, encodingHint] = firstSegment.split(";");
    assert(contentType !== undefined);
    if (encodingHint === "base64") {
        return new Blob([
            Base64.decode(data),
        ], { type: contentType });
    }
    return new Blob([data], { type: contentType });
}
