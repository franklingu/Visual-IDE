from gaesessions import SessionMiddleware
import os


def webapp_add_wsgi_middleware(app):
    key = str(os.urandom(64))
    app = SessionMiddleware(app, cookie_key=key)
    return app
