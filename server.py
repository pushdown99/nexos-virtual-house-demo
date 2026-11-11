import http.server, os, urllib.request

# house3d-web = house3d.nexoscare.com (가상 중간집 three.js, Vite 빌드 dist 정적 서빙).
# 라이브 데이터: 브라우저가 wss://horizon.nexoscare.com/sensors4/ws 로 직접 붙는다(크로스오리진 WS 허용, origin 검사 없음).
# /horizon-map, /horizon-history/* 는 horizon 으로 프록시(브라우저 same-origin REST 용, 향후 이력).
PORT = int(os.environ.get("PORT", "8080"))
HORIZON = os.environ.get("HORIZON_ORIGIN", "https://horizon.nexoscare.com").rstrip("/")
ROOT = os.environ.get("WEB_ROOT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist"))
os.chdir(ROOT)


class H(http.server.SimpleHTTPRequestHandler):
    def _proxy(self, path):
        try:
            req = urllib.request.Request(HORIZON + path, headers={"accept": "application/json"})
            with urllib.request.urlopen(req, timeout=6) as r:
                body = r.read()
            self.send_response(200)
            self.send_header("content-type", "application/json; charset=utf-8")
            self.send_header("cache-control", "no-cache")
            self.end_headers()
            self.wfile.write(body)
        except Exception:
            self.send_response(502)
            self.send_header("content-type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"{}")

    def do_GET(self):
        p = self.path.split("?")[0]
        q = self.path[len(p):]
        if p == "/horizon-map":
            return self._proxy("/horizon-map")
        if p.startswith("/horizon-history"):
            return self._proxy(p + q)
        return super().do_GET()


http.server.ThreadingHTTPServer(("", PORT), H).serve_forever()
