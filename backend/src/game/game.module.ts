import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameStateService } from './game-state.service';

@Module({
  providers: [GameGateway, GameService, GameStateService],
})
export class GameModule {}
