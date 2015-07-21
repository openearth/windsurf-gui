import json
from pyramid.view import view_config
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.httpexceptions import HTTPNotFound

from bc import BoundaryConditions

@view_config(route_name='home', renderer='templates/gui.pt')
def home(request):
    return {}


@view_config(route_name='api', request_method='GET', renderer='jsonp')
@view_config(route_name='api', request_method='POST', renderer='jsonp')
def get_scenario(context, request):
    g = request.GET
    kwargs = {k:float(v) for k,v in g.iteritems() if k in ['duration',
                                                           'dt',
                                                           'water_level',
                                                           'wave_height',
                                                           'wave_period',
                                                           'wind_speed',
                                                           'seed']}

    bc = BoundaryConditions(**kwargs)

    if g.has_key('scenario'):
        s = json.loads(g['scenario'])
        bc.render_scenario(s)

    r = bc.to_dict()

    if r is None:
        raise HTTPNotFound()
    else:
        return r

    
#@notfound_view_config()
#def notfound(request):
#    return Response(
#        body=json.dumps({'message': 'Requested page not found'}),
#        status='404 Not Found',
#        content_type='application/json')
