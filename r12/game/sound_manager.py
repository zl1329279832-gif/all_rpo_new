import pygame
import os
from .utils import load_settings, save_settings
from .constants import DEFAULT_SETTINGS

class SoundManager:
    def __init__(self):
        pygame.mixer.init()
        
        self.settings = load_settings()
        
        self.sound_enabled = self.settings.get('sound_enabled', DEFAULT_SETTINGS['sound_enabled'])
        self.music_enabled = self.settings.get('music_enabled', DEFAULT_SETTINGS['music_enabled'])
        self.sound_volume = self.settings.get('sound_volume', DEFAULT_SETTINGS['sound_volume'])
        self.music_volume = self.settings.get('music_volume', DEFAULT_SETTINGS['music_volume'])
        
        self.sounds = {}
        self._load_sounds()

    def _load_sounds(self):
        sound_effects = {
            'shoot': self._create_beep(800, 100),
            'explosion': self._create_noise(200),
            'powerup': self._create_beep(1200, 150),
            'hit': self._create_beep(300, 100),
            'game_over': self._create_beep(200, 500),
            'level_up': self._create_beep(600, 300),
            'bomb': self._create_noise(500),
        }
        
        self.sounds = sound_effects

    def _create_beep(self, frequency, duration):
        import numpy as np
        
        sample_rate = 44100
        n_samples = int(sample_rate * duration / 1000)
        
        t = np.linspace(0, duration / 1000, n_samples, False)
        wave = np.sin(2 * np.pi * frequency * t)
        
        envelope = np.linspace(1, 0, n_samples)
        wave = wave * envelope
        
        wave = (wave * 32767).astype(np.int16)
        
        stereo_wave = np.column_stack((wave, wave))
        
        sound = pygame.sndarray.make_sound(stereo_wave)
        return sound

    def _create_noise(self, duration):
        import numpy as np
        
        sample_rate = 44100
        n_samples = int(sample_rate * duration / 1000)
        
        wave = np.random.uniform(-1, 1, n_samples)
        
        envelope = np.linspace(1, 0, n_samples)
        wave = wave * envelope
        
        wave = (wave * 32767).astype(np.int16)
        
        stereo_wave = np.column_stack((wave, wave))
        
        sound = pygame.sndarray.make_sound(stereo_wave)
        return sound

    def play_sound(self, sound_name):
        if not self.sound_enabled:
            return
        
        if sound_name in self.sounds:
            self.sounds[sound_name].set_volume(self.sound_volume)
            self.sounds[sound_name].play()

    def play_music(self):
        if not self.music_enabled:
            return
        
        try:
            pygame.mixer.music.stop()
        except:
            pass

    def stop_music(self):
        try:
            pygame.mixer.music.stop()
        except:
            pass

    def toggle_sound(self):
        self.sound_enabled = not self.sound_enabled
        self._save_settings()
        return self.sound_enabled

    def toggle_music(self):
        self.music_enabled = not self.music_enabled
        self._save_settings()
        if self.music_enabled:
            self.play_music()
        else:
            self.stop_music()
        return self.music_enabled

    def set_sound_volume(self, volume):
        self.sound_volume = max(0, min(1, volume))
        self._save_settings()

    def set_music_volume(self, volume):
        self.music_volume = max(0, min(1, volume))
        try:
            pygame.mixer.music.set_volume(self.music_volume)
        except:
            pass
        self._save_settings()

    def _save_settings(self):
        self.settings['sound_enabled'] = self.sound_enabled
        self.settings['music_enabled'] = self.music_enabled
        self.settings['sound_volume'] = self.sound_volume
        self.settings['music_volume'] = self.music_volume
        save_settings(self.settings)

    def get_settings(self):
        return {
            'sound_enabled': self.sound_enabled,
            'music_enabled': self.music_enabled,
            'sound_volume': self.sound_volume,
            'music_volume': self.music_volume
        }
