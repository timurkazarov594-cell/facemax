import { useListSpeakTutorAchievements } from "@workspace/api-client-react";
import { Trophy, Lock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Achievements() {
  const { data: achievements, isLoading } = useListSpeakTutorAchievements();

  if (isLoading) {
    return <div className="p-10">Загрузка...</div>;
  }

  if (!achievements) return null;

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const progress = (unlockedCount / achievements.length) * 100;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-chart-3/10 rounded-full flex items-center justify-center mx-auto mb-4 text-chart-3 shadow-[0_0_40px_-10px_rgba(255,167,38,0.5)]">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Зал Славы</h1>
        <p className="text-muted-foreground mb-6">Выполняйте задания, общайтесь с ИИ и получайте уникальные достижения.</p>
        
        <div className="bg-card border border-border/50 p-4 rounded-2xl flex items-center gap-4 text-left">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span>Открыто достижений</span>
              <span className="text-chart-3">{unlockedCount} / {achievements.length}</span>
            </div>
            <Progress value={progress} className="h-2 bg-background" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className={`overflow-hidden transition-all duration-300 ${
            achievement.isUnlocked 
              ? 'bg-card/80 border-chart-3/30 shadow-[0_0_20px_-10px_rgba(255,167,38,0.3)] hover:scale-105' 
              : 'bg-background/40 border-border/30 opacity-70 grayscale-[50%]'
          }`}>
            <CardContent className="p-6 relative flex flex-col items-center text-center h-full">
              {!achievement.isUnlocked && (
                <div className="absolute top-4 right-4 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              
              <div className={`text-6xl mb-4 transition-transform ${achievement.isUnlocked ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,167,38,0.4)]' : 'opacity-50'}`}>
                <span>{achievement.emoji || '🏅'}</span>
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${achievement.isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.titleRu}
              </h3>
              
              <p className="text-sm text-muted-foreground flex-1">
                {achievement.descriptionRu}
              </p>
              
              <div className="mt-6 pt-4 border-t border-border/50 w-full flex justify-between items-center">
                <Badge variant="outline" className={achievement.isUnlocked ? "bg-chart-3/10 text-chart-3 border-chart-3/20" : ""}>
                  <Star className="w-3 h-3 mr-1" />
                  {achievement.xpReward} XP
                </Badge>
                {achievement.unlockedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
