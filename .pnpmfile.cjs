module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Auto-approve essential build scripts
      if (pkg.name === '@prisma/client' ||
          pkg.name === '@prisma/engines' ||
          pkg.name === 'prisma' ||
          pkg.name === 'esbuild' ||
          pkg.name === '@tailwindcss/oxide' ||
          pkg.name === 'sharp') {
        context.log(`Auto-approving build scripts for ${pkg.name}`)
      }
      return pkg
    }
  }
}