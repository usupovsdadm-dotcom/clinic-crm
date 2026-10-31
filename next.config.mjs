const bp = process.env.BASE_PATH || "";
export default { output: "export", basePath: bp, images: { unoptimized: true }, env: { NEXT_PUBLIC_BP: bp }, trailingSlash: true };
