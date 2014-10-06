import webapp2
import jinja2
import os
import json
import re
import logging
from google.appengine.api import users
from Model.models import DbManager

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))


class BaseHanlder(webapp2.RequestHandler):
    def dispatch(self):
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

    def render_json(self, obj):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(obj))


class IndexHandler(BaseHanlder):
    def get(self):
        template = jinja_environment.get_template('index.html')
        template_values = {}
        if self.set_user_if_loggedin():
            template_values['user_name'] = self.user.nickname()
            template_values['logout_url'] = self.get_logout_url()
            titles_list = DbManager.get_saved_project_titles_for_user(self.user.email())
            template_values['titles_list'] = titles_list
            self.render_response(template, template_values)
        else:
            template_values['login_url'] = self.get_login_url()
            self.render_response(template, template_values)


class SaveProjectHandler(BaseHanlder):
    def post(self):
        dic = self.convert_multi_dict_to_dict(self.request.POST)
        title = dic.get('project_title')
        content = json.dumps(dic.get('project_content'))
        if self.set_user_if_loggedin():
            email = self.user.email()
            DbManager.save_project(email, title, content)
            self.render_json({'status': 'Project saved'})
        else:
            self.render_json({'status': 'Please login first'})

    def convert_multi_dict_to_dict(self, multi_dic):
        dic = {}
        title = None
        data = []
        for key in multi_dic.keys():
            match_data = re.match(r'^data\[(\d+)\]\[([a-z]+)\]', key)
            if match_data and match_data.group(2) == 'title':
                data.append({})
        for item in multi_dic.keys():
            match_data = re.match(r'^data\[(\d+)\]\[([a-z]+)\]', item)
            if match_data:
                data[int(match_data.group(1))][match_data.group(2)] = multi_dic[item]
            else:
                title = multi_dic[item]
        dic['project_title'] = title
        dic['project_content'] = data
        return dic


class LoadProjecthandler(BaseHanlder):
    def get(self):
        if self.set_user_if_loggedin():
            user_email = self.user.email()
            project_title = self.request.GET.get('project_title')
            project = DbManager.get_saved_project_for_user(user_email, project_title)
            if project:
                title = project.project_title
                content = json.loads(project.project_content)
            else:
                title = None
                content = None
            self.render_json({'status': 'Project loaded', 'title': title, 'data': content})
        else:
            self.render_json({'status': 'Please login first'})


class LoadTitlesListHandler(BaseHanlder):
    def get(self):
        if self.set_user_if_loggedin():
            titles_list = DbManager.get_saved_project_titles_for_user(self.user.email())
            self.render_json({'status': 'Titles list loaded', 'project_title': titles_list})
        else:
            self.render_json({'status': 'Please login first'})


app = webapp2.WSGIApplication([
    ('/', IndexHandler),
    ('/save/', SaveProjectHandler),
    ('/load/', LoadProjecthandler)
], debug=True)
