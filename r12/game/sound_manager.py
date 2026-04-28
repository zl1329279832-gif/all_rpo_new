import pygame
from .utils import load_settings, save_settings
from .constants import DEFAULT_SETTINGS

class SoundManager:
    def __init__(self):
        try:
            pygame.mixer.init()
            self.mixer_available = True
        except:
            self.mixer_available = False
        
        self.settings = load_settings()
        
        self.sound_enabled = self.settings.get('sound_enabled', DEFAULT_SETTINGS['sound_enabled'])
        self.music_enabled = self.settings.get('music_enabled', DEFAULT_SETTINGS['music_enabled'])
        self.sound_volume = self.settings.get('sound_volume', DEFAULT_SETTINGS['sound_volume'])
        self.music_volume = self.settings.get('music_volume', DEFAULT_SETTINGS['music_volume'])
        
        self.sounds = {}
        self._load_sounds()

    def _load_sounds(self):
        if not self.mixer_available:
            return
        
        self.sounds = {
            'shoot': None,
            'explosion': None,
            'powerup': None,
            'hit': None,
            'game_over': None,
            'level_up': None,
            'bomb': None,
        }

    def play_sound(self, sound_name):
        if not self.sound_enabled or not self.mixer_available:
            return
        
        pass

    def play_music(self):
        if not self.music_enabled or not self.mixer_available:
            return
        
        try:
            pygame.mixer.music.stop()
        except:
            pass

    def stop_music(self):
        if not self.mixer_available:
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
        if self.mixer_available:
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
