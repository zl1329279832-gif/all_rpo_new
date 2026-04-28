from .utils import load_settings, save_settings
from .constants import DEFAULT_SETTINGS, SCREEN_WIDTH, SCREEN_HEIGHT

class SettingsManager:
    def __init__(self):
        self.settings = load_settings()
        self._ensure_defaults()

    def _ensure_defaults(self):
        for key, default_value in DEFAULT_SETTINGS.items():
            if key not in self.settings:
                self.settings[key] = default_value
        self.save()

    def get(self, key, default=None):
        return self.settings.get(key, default)

    def set(self, key, value):
        self.settings[key] = value

    def save(self):
        save_settings(self.settings)

    def reset_to_defaults(self):
        self.settings = DEFAULT_SETTINGS.copy()
        self.save()

    def get_all(self):
        return self.settings.copy()

    def update_high_score(self, score):
        current_high = self.settings.get('high_score', 0)
        if score > current_high:
            self.settings['high_score'] = score
            self.save()
            return True
        return False

    def get_high_score(self):
        return self.settings.get('high_score', 0)

    def get_window_size(self):
        return (
            self.settings.get('window_width', SCREEN_WIDTH),
            self.settings.get('window_height', SCREEN_HEIGHT)
        )

    def set_window_size(self, width, height):
        self.settings['window_width'] = width
        self.settings['window_height'] = height
        self.save()

    def get_default_nickname(self):
        return self.settings.get('default_nickname', 'Player')

    def set_default_nickname(self, nickname):
        self.settings['default_nickname'] = nickname
        self.save()

    def is_sound_enabled(self):
        return self.settings.get('sound_enabled', True)

    def is_music_enabled(self):
        return self.settings.get('music_enabled', True)

    def toggle_sound(self):
        self.settings['sound_enabled'] = not self.settings.get('sound_enabled', True)
        self.save()
        return self.settings['sound_enabled']

    def toggle_music(self):
        self.settings['music_enabled'] = not self.settings.get('music_enabled', True)
        self.save()
        return self.settings['music_enabled']

    def is_auto_shoot_enabled(self):
        return self.settings.get('auto_shoot', False)

    def toggle_auto_shoot(self):
        self.settings['auto_shoot'] = not self.settings.get('auto_shoot', False)
        self.save()
        return self.settings['auto_shoot']
