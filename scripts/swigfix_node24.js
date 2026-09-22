var fs = require("fs");

var path = __dirname + "/../src/libxml2.cc";
var source = fs.readFileSync(path).toString();
var major = parseInt(process.versions.node.split(".")[0], 10);

// Node 24+: FunctionCallbackInfo.Holder() was removed.
// Node 26+: PropertyCallbackInfo.Holder() was renamed to HolderV2().
source = source
    .replaceAll("args.Holder()", "args.This()")
    .replaceAll("info.Holder()", "info.HolderV2()");

// Node 25+/V8 14.2+: aligned pointer APIs require an EmbedderDataTypeTag,
// and String::WriteUtf8 / Utf8Length were replaced by *V2.
if (major >= 25) {
    source = source
        .replace(
            /GetAlignedPointerFromInternalField\((\d+)\)/g,
            "GetAlignedPointerFromInternalField($1, v8::kEmbedderDataTypeTagDefault)"
        )
        .replace(
            /SetAlignedPointerInInternalField\(([^,]+),\s*([^,)]+)\)/g,
            "SetAlignedPointerInInternalField($1, $2, v8::kEmbedderDataTypeTagDefault)"
        )
        .replace(
            "#define SWIGV8_WRITE_UTF8(handle, buffer, len) (handle)->WriteUtf8(v8::Isolate::GetCurrent(), buffer, len)",
            "#define SWIGV8_WRITE_UTF8(handle, buffer, len) (handle)->WriteUtf8V2(v8::Isolate::GetCurrent(), buffer, static_cast<size_t>(len), v8::String::WriteFlags::kNullTerminate)"
        )
        .replace(
            "#define SWIGV8_UTF8_LENGTH(handle) (handle)->Utf8Length(v8::Isolate::GetCurrent())",
            "#define SWIGV8_UTF8_LENGTH(handle) (handle)->Utf8LengthV2(v8::Isolate::GetCurrent())"
        );
}

fs.writeFileSync(path, source);
