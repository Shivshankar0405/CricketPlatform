import { db } from "./firebase-config";
import { doc, runTransaction, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const auth = getAuth();

export class CricketGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gameState = {
      score: 0,
      ballsRemaining: 10,
      multiplier: 1,
      activePowerups: []
    };
  }

  async startGame(gameId) {
    const gameDoc = doc(db, 'games', gameId);
    const userDoc = doc(db, 'users', auth.currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const game = await transaction.get(gameDoc);
        const user = await transaction.get(userDoc);
        
        if (user.data().coins < game.data().cost) {
          throw new Error('Insufficient coins');
        }

        transaction.update(userDoc, {
          coins: user.data().coins - game.data().cost
        });
      });

      this.initGameLoop();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleSwing(timingPrecision) {
    const runs = this.calculateRuns(timingPrecision);
    await this.updateGameState(runs);
  }

  async updateGameState(runs) {
    const userDoc = doc(db, 'users', auth.currentUser.uid);
    const leaderboardRef = doc(db, 'leaderboards', 'batting');

    try {
      await runTransaction(db, async (transaction) => {
        const user = await transaction.get(userDoc);
        const newCoins = user.data().coins + (runs * 10);
        const newScore = user.data().stats?.totalRuns + runs || runs;

        transaction.update(userDoc, {
          coins: newCoins,
          'stats.totalRuns': newScore,
          'stats.highScore': Math.max(
            user.data().stats?.highScore || 0,
            runs
          )
        });

        transaction.update(leaderboardRef, {
          topPlayers: arrayUnion({
            userId: auth.currentUser.uid,
            score: runs,
            timestamp: new Date().toISOString()
          })
        });
      });

      this.gameState.score += runs;
      this.gameState.ballsRemaining--;
      this.updateUI();
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  }

  calculateRuns(timing) {
    const baseRuns = Math.floor((300 - Math.abs(150 - timing)) / 50);
    return baseRuns * this.gameState.multiplier;
  }

  initGameLoop() {
    // Canvas animation logic
    let ballPosition = 0;
    const animate = () => {
      if (this.gameState.ballsRemaining > 0) {
        ballPosition += 5;
        this.drawBall(ballPosition);
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  drawBall(position) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    this.ctx.arc(position, 150, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fill();
  }
}