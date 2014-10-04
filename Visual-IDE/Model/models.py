from google.appengine.ext import db


class SavedProject(db.Model):
    user_email = db.EmailProperty()
    project_name = db.StringProperty()
    project_content = db.TextProperty()
    created_at = db.DateTimeProperty(auto_now_add=True)


class DbManager(object):
    def __init__(self):
        super(DbManager, self).__init__()

    @classmethod
    def get_saved_projects_for_user(self, user_email):
        query_results = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1", user_email)
        return query_results

    @classmethod
    def save_project(self, project):
        assert project
        query_results = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1 AND project_name = :2",
                                    project.user_email, project.project_name)
        if query_results:
            query_results[0].project_content = project.project_content
            query_results[0].created_at = project.created_at
            query_results[0].put()
        else:
            project.put()

    @classmethod
    def delete_project(self, user_email, project_name):
        query_results = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1 AND project_name = :2",
                                    user_email, project_name)
        if query_results:
            for item in query_results:
                item.delete()
        else:
            pass
