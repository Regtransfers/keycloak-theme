declare module "*.css";


interface Window {
    /** Set by src/main.tsx when the bundle starts. Read by src/loader/assetRetry.js. */
    __rtThemeBooted?: boolean;
}
