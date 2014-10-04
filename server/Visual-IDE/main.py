import webapp2
import jinja2
import os
import json
from google.appengine.api import users
from util.sessions import Session

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))


class BaseHanlder(webapp2.RequestHandler):
    def dispatch(self):
        self.session = Session()
        super(BaseHanlder, self).dispatch()

    def set_user_if_loggedin(self):
        user = users.get_current_user()
        if user:
            self.user = user
            return True
        else:
            self.user = None
            return False

    def get_logout_url(self):
        return users.create_logout_url(self.request.host_url)

    def get_login_url(self):
        return users.create_login_url(self.request.host_url)

    def render_response(self, template, template_values):
        self.response.out.write(template.render(template_values))


class IndexHandler(BaseHanlder):
    def dispatch(self):
        self.session = Session()
        webapp2.RequestHandler.dispatch(self)

    def get(self):
        template = jinja_environment.get_template('index.html')
        template_values = {}
        if self.set_user_if_loggedin():
            template_values['user_name'] = self.user.nickname()
            template_values['logout_url'] = self.get_logout_url()
            self.render_response(template, template_values)
        else:
            template_values['login_url'] = self.get_login_url()
            self.render_response(template, template_values)


class SaveProjectHandler(BaseHanlder):
    def post(self):
        if self.set_user_if_loggedin():
            self.render_json({'status': 'loggedin'})
        else:
            self.session['project_name'] = 'haha'
            self.session['project_content'] = 'this is test'
            self.render_json({'status': 'loggedout'})

    def render_json(self, obj):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(obj))


class LoadProjecthandler(BaseHanlder):
    def get(self):
        if self.set_user_if_loggedin():
            self.render_json({'status': 'loggedin'})
        else:
            self.session['project_name'] = 'haha'
            self.session['project_content'] = 'this is test'
            self.render_json({'status': 'loggedout'})

    def render_json(self, obj):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(obj))

app = webapp2.WSGIApplication([
    ('/', IndexHandler),
    ('/save', SaveProjectHandler),
    ('/load', LoadProjecthandler)
], debug=True)
