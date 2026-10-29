// Public rules shared by solo and both local-duel variants.
RL.scoring={
  secondsPerError:15,pointsPerUnlock:100,pointsPerError:20,
  completion(elapsed,errors){const adjustedSeconds=elapsed+errors*this.secondsPerError;return {elapsed,errors,adjustedSeconds,score:Math.max(0,1200-adjustedSeconds*3)}},
  timed(unlocked,errors){return Math.max(0,unlocked*this.pointsPerUnlock-errors*this.pointsPerError)},
  compare(a,b,variant){return variant==='timed'?(a.score-b.score||a.piecesUnlocked-b.piecesUnlocked||b.errors-a.errors):(b.adjustedSeconds-a.adjustedSeconds||b.errors-a.errors)}
};
