import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PRODUCT_MAPPINGS = [
  // Cakes
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Biscoff.avif", productSlug: "biscoff" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Black Forest.avif", productSlug: "black-forest" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Blueberry.avif", productSlug: "blueberry" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Butterscotch.avif", productSlug: "butterscotch" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Choco Delight.avif", productSlug: "choco-delight" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Choco Fantasy.avif", productSlug: "choco-fantasy" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Choco Hazelnut.avif", productSlug: "choco-hazelnut" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Choco Irish Coffee.avif", productSlug: "choco-irish-coffee" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Choco Oreo.avif", productSlug: "choco-oreo" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Choco Vanilla.avif", productSlug: "choco-vanilla" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Chocolate Truffle.avif", productSlug: "chocolate-truffle" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Death by Chocolate.avif", productSlug: "death-by-chocolate" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "German Black Forest.avif", productSlug: "german-black-forest" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Irish Coffee.avif", productSlug: "irish-coffee" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Litchi.avif", productSlug: "litchi" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Mango.avif", productSlug: "mango" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Pineapple Exotic.avif", productSlug: "pineapple-exotic" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Pineapple.avif", productSlug: "pineapple" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Rainbow.avif", productSlug: "rainbow" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Red Velvet.avif", productSlug: "red-velvet" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Strawberry.avif", productSlug: "strawberry" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "Vanilla.avif", productSlug: "vanilla" },
  { categoryDir: "Cakes", categorySlug: "cakes", file: "White Forest.avif", productSlug: "white-forest" },

  // Mini pizzas
  { categoryDir: "Mini pizzas", categorySlug: "mini-pizzas", file: "Cheesy Pizza (junior).avif", productSlug: "cheesy-pizza" },
  { categoryDir: "Mini pizzas", categorySlug: "mini-pizzas", file: "Spicy Paneer Pizza (junior).avif", productSlug: "spicy-paneer-pizza" },
  { categoryDir: "Mini pizzas", categorySlug: "mini-pizzas", file: "Veggie Paradise Pizza (junior).avif", productSlug: "veggie-paradise-pizza" },

  // Sandwiches
  { categoryDir: "Sandwiches", categorySlug: "sandwiches", file: "Chilli Cheese Sandwich (baby size).avif", productSlug: "chilli-cheese-sandwich" },
  { categoryDir: "Sandwiches", categorySlug: "sandwiches", file: "Chocolate Sandwich (baby size).avif", productSlug: "chocolate-sandwich" },
  { categoryDir: "Sandwiches", categorySlug: "sandwiches", file: "Paneer Sandwich (baby size).avif", productSlug: "paneer-sandwich" },
  { categoryDir: "Sandwiches", categorySlug: "sandwiches", file: "Veg Sandwich (baby size).avif", productSlug: "veg-sandwich" },

  // Soups
  { categoryDir: "Soups", categorySlug: "soups", file: "Sweet Corn Soup.avif", productSlug: "sweet-corn-soup" },
  { categoryDir: "Soups", categorySlug: "soups", file: "Tomato Soup.avif", productSlug: "tomato-soup" },
];

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 900;
const WEBP_QUALITY = 84;
const MAX_FILE_SIZE_BYTES = 300 * 1024; // 300 KB

async function main() {
  const rootDir = process.cwd();
  const publicProductsDir = path.join(rootDir, "public", "images", "products");
  const optimizedDir = path.join(publicProductsDir, "optimized");
  const sourceArchiveDir = path.join(rootDir, "assets", "source-product-images");

  console.log("=== Namma Bakery Product Image Optimizer ===");
  console.log(`Target: ${TARGET_WIDTH}x${TARGET_HEIGHT} WebP (quality ${WEBP_QUALITY})`);
  console.log(`Max file size target: ${(MAX_FILE_SIZE_BYTES / 1024).toFixed(0)} KB\n`);

  fs.mkdirSync(optimizedDir, { recursive: true });
  fs.mkdirSync(sourceArchiveDir, { recursive: true });

  const results = [];
  const manifestEntries = {};

  for (const item of PRODUCT_MAPPINGS) {
    // Check if source file is in assets archive or in public directory
    const pathInArchive = path.join(sourceArchiveDir, item.categoryDir, item.file);
    const pathInPublic = path.join(publicProductsDir, item.categoryDir, item.file);

    let srcPath = null;
    let foundIn = null;

    if (fs.existsSync(pathInArchive)) {
      srcPath = pathInArchive;
      foundIn = "archive";
    } else if (fs.existsSync(pathInPublic)) {
      srcPath = pathInPublic;
      foundIn = "public";
    }

    if (!srcPath) {
      console.error(`[ERROR] Missing source file: ${item.categoryDir}/${item.file}`);
      results.push({ item, success: false, error: "File not found" });
      continue;
    }

    const outCatDir = path.join(optimizedDir, item.categorySlug);
    fs.mkdirSync(outCatDir, { recursive: true });
    const outFilename = `${item.productSlug}.webp`;
    const outPath = path.join(outCatDir, outFilename);

    // Convert & optimize
    await sharp(srcPath)
      .rotate() // Respect EXIF orientation
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .toColorspace("srgb")
      .webp({
        quality: WEBP_QUALITY,
        effort: 6,
      })
      .toFile(outPath);

    // Verify converted image
    const meta = await sharp(outPath).metadata();
    const stats = fs.statSync(outPath);

    if (meta.width !== TARGET_WIDTH || meta.height !== TARGET_HEIGHT) {
      throw new Error(`Dimension mismatch for ${outFilename}: got ${meta.width}x${meta.height}`);
    }
    if (meta.format !== "webp") {
      throw new Error(`Format mismatch for ${outFilename}: got ${meta.format}`);
    }

    const sizeKb = (stats.size / 1024).toFixed(1);
    const publicUrl = `/images/products/optimized/${item.categorySlug}/${outFilename}`;
    manifestEntries[`${item.categorySlug}/${item.productSlug}`] = publicUrl;

    results.push({
      item,
      srcPath,
      foundIn,
      outPath,
      publicUrl,
      sizeKb,
      width: meta.width,
      height: meta.height,
      success: true,
      underLimit: stats.size <= MAX_FILE_SIZE_BYTES,
    });

    console.log(
      `✓ [${item.categorySlug}] ${item.file} -> ${outFilename} (${meta.width}x${meta.height}, ${sizeKb} KB, sRGB WebP)`
    );
  }

  // Check if all succeeded
  const allSucceeded = results.every((r) => r.success);
  if (!allSucceeded) {
    console.error("\nSome image conversions failed! Halting before moving source files.");
    process.exit(1);
  }

  console.log(`\nAll ${results.length} conversions verified successfully!`);

  // Move originals from public to assets archive if any were found in public
  console.log("\nMoving original AVIF files to local archive assets/source-product-images/...");
  for (const res of results) {
    if (res.foundIn === "public") {
      const destCatDir = path.join(sourceArchiveDir, res.item.categoryDir);
      fs.mkdirSync(destCatDir, { recursive: true });
      const destPath = path.join(destCatDir, res.item.file);
      fs.copyFileSync(res.srcPath, destPath);
      fs.unlinkSync(res.srcPath);
    }
  }

  // Clean up empty directories in publicProductsDir (except optimized)
  for (const item of PRODUCT_MAPPINGS) {
    const dir = path.join(publicProductsDir, item.categoryDir);
    if (fs.existsSync(dir)) {
      const remaining = fs.readdirSync(dir);
      if (remaining.length === 0) {
        fs.rmdirSync(dir);
      }
    }
  }

  // Generate manifest file
  const manifestTsPath = path.join(rootDir, "lib", "menu", "product-images-manifest.ts");
  const manifestContent = `// Auto-generated by scripts/optimize-product-images.mjs. Do not edit directly.
export const PRODUCT_IMAGE_MANIFEST: Record<string, string> = ${JSON.stringify(manifestEntries, null, 2)};
`;
  fs.writeFileSync(manifestTsPath, manifestContent, "utf8");
  console.log(`✓ Generated manifest at ${manifestTsPath}`);

  console.log("\n=== Conversion and Integration Complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
