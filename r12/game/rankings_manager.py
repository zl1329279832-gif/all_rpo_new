import datetime
from .utils import load_rankings, save_rankings
from .constants import MAX_RANKINGS

class RankingsManager:
    def __init__(self):
        self.rankings = load_rankings()

    def add_score(self, nickname, score, level=1):
        entry = {
            'nickname': nickname,
            'score': score,
            'level': level,
            'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        self.rankings.append(entry)
        self.rankings.sort(key=lambda x: x['score'], reverse=True)
        self.rankings = self.rankings[:MAX_RANKINGS]
        
        save_rankings(self.rankings)
        return self.get_rank(entry['score'])

    def get_rank(self, score):
        for i, entry in enumerate(self.rankings):
            if entry['score'] <= score:
                return i + 1
        return len(self.rankings) + 1

    def get_top_scores(self, count=MAX_RANKINGS):
        return self.rankings[:count]

    def get_highest_score(self):
        if self.rankings:
            return self.rankings[0]['score']
        return 0

    def is_high_score(self, score):
        if not self.rankings:
            return True
        if len(self.rankings) < MAX_RANKINGS:
            return True
        return score > self.rankings[-1]['score']

    def clear_rankings(self):
        self.rankings = []
        save_rankings(self.rankings)

    def get_all_rankings(self):
        return self.rankings.copy()

    def get_player_best(self, nickname):
        player_scores = [r for r in self.rankings if r['nickname'] == nickname]
        if player_scores:
            return max(player_scores, key=lambda x: x['score'])
        return None
