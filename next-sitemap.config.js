module.exports = {
  siteUrl: "https://whitephosphorus.info/",
  generateRobotsTxt: true,
  /**
   * Prototype routes. next-sitemap walks the build output, so anything under src/app ends
   * up advertised to search engines on the next `npm run build` unless it is named here —
   * which is how four superseded timeline prototypes once found their way in.
   */
  exclude: ["/map-layers"],
};
