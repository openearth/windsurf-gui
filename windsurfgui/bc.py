import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


class BoundaryConditions:


    duration = 0.
    dt = 0.

    
    def __init__(self, duration=365*24*3600., dt=3600.,
                 water_level=0., wave_height=0., wave_period=0., wind_speed=0., seed=123):
        '''Initialize the boundary class
        
        Parameters
        ----------
        duration : float
            simulation duration in seconds
        dt : float
            time resolution in seconds
            
        '''

        np.random.seed(int(seed))

        self.duration = duration
        self.dt = dt

        idx = np.arange(0, duration, dt)
        self.df = pd.DataFrame({'water_level':np.zeros(len(idx)) + water_level,
                                'wave_height':np.zeros(len(idx)) + wave_height,
                                'wave_period':np.zeros(len(idx)) + wave_period,
                                'wind_speed':np.zeros(len(idx)) + wind_speed}, index=idx)
        

    def to_dict(self):
        r = {'time': list(self.df.index),
             'water_level': list(self.df['water_level']),
             'wave_height': list(self.df['wave_height']),
             'wave_period': list(self.df['wave_period']),
             'wind_speed': list(self.df['wind_speed'])}

        return r


    def render_scenario(self, scenario):
        for item in scenario:
            try:
                typ, kwargs = item
                if typ == 'tide':
                    self.add_tide(**kwargs)
                elif typ == 'wind':
                    self.add_wind(**kwargs)
                elif typ == 'surge':
                    self.add_surge(**kwargs)
            except Exception as e:
                print e
                continue

                
    def add_tide(self, amplitude=0., period=12.25*3600, phase=0.):
        self.df['water_level'] += amplitude * np.cos(2*np.pi*(self.df.index-phase)/period)


    def add_wind(self, u_max=0., duration=365*24*3600./2, t_max=None):
        t = np.asarray(self.df.index)
        
        u_max = self._getrandom(u_max, distribution='normal')
        t_max = self._getrandom(t_max, t)
        duration = self._getrandom(duration)

        idx = (t>=t_max-duration/2.) & (t<t_max+duration/2.)

        self.df['wind_speed'].ix[idx] = np.maximum(
            self.df['wind_speed'].ix[idx],
            (u_max * np.cos(np.pi*(t-t_max)/duration)**3.)[idx])


    def add_surge(self, surge=[0., 1.], Hs_max=[4., 2.], Tp_max=[8., 4.], u_max=[10., 5.],
                  duration=[30*3600., 35*3600.], t_max=None, nsurge=1):
    
        t = np.asarray(self.df.index)

        nsurge = int(self._getrandom(nsurge))

        for i in range(nsurge+1):
            
            surge_i = self._getrandom(surge, distribution='weibull')
            Hs_max_i = self._getrandom(Hs_max, distribution='normal')
            Tp_max_i = self._getrandom(Tp_max, distribution='normal')
            duration_i = self._getrandom(duration)
            t_max_i = self._getrandom(t_max, t)

            idx = (t>=t_max_i-duration_i/2.) & (t<t_max_i+duration_i/2.)
            self.df['water_level'].ix[idx] = np.maximum(
                self.df['water_level'].ix[idx],
                (surge_i * np.cos(np.pi*(t-t_max_i)/duration_i)**2.)[idx])
            
            idx = (t>=t_max_i-duration_i/2.*3.) & (t<t_max_i+duration_i/2.*3.)
            self.df['wave_height'].ix[idx] = np.maximum(
                self.df['wave_height'].ix[idx],
                (Hs_max_i * np.cos(np.pi*(t-t_max_i)/duration_i/3.)**2.)[idx])
            self.df['wave_period'].ix[idx] = np.maximum(
                self.df['wave_period'].ix[idx],
                (Tp_max_i * np.cos(np.pi*(t-t_max_i)/duration_i/3.))[idx])
            
            self.add_wind(u_max, duration=duration_i*3., t_max=t_max_i)
        

    def plot(self, *args, **kwargs):
        
        fig, axs = plt.subplots(3, 1, figsize=(10, 16))
        axs = list(axs[:2]) + [axs[1].twinx()] + list(axs[-1:])

        t = np.asarray(self.df.index)
        
        axs[0].plot(t, self.df['water_level'])
        p1 = axs[1].plot(t, self.df['wave_height'], '-b')
        p2 = axs[2].plot(t, self.df['wave_period'], '-g')
        axs[3].plot(t, self.df['wind_speed'], '-r')

        axs[0].set_ylabel('water level [m]')
        axs[1].set_ylabel('wave height [m]')
        axs[2].set_ylabel('wave period [s]')
        axs[3].set_ylabel('wind speed')

        axs[1].legend(p1 + p2, ('wave height', 'wave period'), loc='upper right')

        for ax in axs:
            ax.set_xlim((self.df.index[0],
                         self.df.index[-1]))
            
        return fig, axs
    
    
    def _getrandom(self, x, x0=None, distribution='uniform'):
        if x is None:
            x = x0
        if self._iterable(x):
            if len(x) == 1:
                x = x[0]
            elif x[0] == x[1]:
                x = x[0]
            elif distribution == 'normal':
                x = np.random.normal(np.mean(x), np.diff(x)/4.)
            elif distribution == 'weibull':
                x = np.minimum(x[1], x[0] + np.random.weibull(1))
            else:
                x = x[0] + np.random.rand(1) * (x[-1] - x[0])
            x = np.maximum(0., x)
        return x


    @staticmethod
    def _iterable(x):
        try:
            x = iter(x)
            return True
        except:
            return False
