export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.lndy.org") {
      url.protocol = "https:";
      url.hostname = "lndy.org";
      url.port = "";
      return Response.redirect(url.href, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
