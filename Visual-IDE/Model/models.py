from google.appengine.ext import db


class SavedProject(db.Model):
    user_email = db.EmailProperty()
    project_title = db.StringProperty()
    project_content = db.TextProperty()
    created_at = db.DateTimeProperty(auto_now_add=True)


class DbManager(object):
    def __init__(self):
        super(DbManager, self).__init__()

    @classmethod
    def get_saved_project_titles_for_user(self, user_email):
        if user_email is None:
            return None
        query_results = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1", user_email)
        titles_list = []
        for item in query_results:
            titles_list.append(item.project_title)
        return titles_list

    @classmethod
    def get_saved_project_for_user(self, user_email, project_title):
        if user_email is None or project_title is None:
            return None
        query_results = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1 AND project_title = :2",
                                    user_email, project_title).get()
        return query_results

    @classmethod
    def save_project(self, user_email, project_title, project_content):
        if user_email is None or project_title is None or project_content is None:
            return False
        query_result = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1 AND project_title = :2",
                                   user_email, project_title).get()
        if query_result:
            query_result.project_content = project_content
            query_result.put()
        else:
            project = SavedProject()
            project.user_email = user_email
            project.project_title = project_title
            project.project_content = project_content
            project.put()
        return True

    @classmethod
    def delete_project(self, user_email, project_title):
        if user_email is None or project_title is None:
            return False
        query_results = db.GqlQuery("SELECT * FROM SavedProject WHERE user_email = :1 AND project_title = :2",
                                    user_email, project_title)
        if query_results:
            for item in query_results:
                item.delete()
        else:
            pass
        return True
