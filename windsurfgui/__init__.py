from pyramid.config import Configurator
from pyramid.renderers import JSON, JSONP
from pyramid.httpexceptions import HTTPNotFound


def not_found(request):
    return HTTPNotFound()


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(settings=settings)
    config.add_renderer('jsonp', JSONP(param_name='callback'))
    config.include('pyramid_chameleon')
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('home', '/')
    config.add_route('api', '/api')
    config.add_notfound_view(not_found, append_slash=True)
    config.scan()
    return config.make_wsgi_app()
