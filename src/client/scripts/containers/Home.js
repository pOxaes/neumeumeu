import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";
import GameList from "client/components/GameList";
import { LoginStatusContainer } from "client/components/LoginStatus";
import StrokedText from "client/components/StrokedText";
import GameStatus from "common/constants/game-status";
import { joinLobby, leaveLobby } from "client/actions";
import { updatePath } from "redux-simple-router";

export default class Home extends PureComponent {
  componentWillMount() {
    this.props.joinLobby();
  }

  componentWillUnmount() {
    this.props.leaveLobby();
  }

  renderEmptyGamesPlaceholder = () => (
    <div className="home__section">
      <p className="home__placeholder">No game in progress :(</p>
    </div>
  );

  renderPlayersGames = games => (
    <div className="home__section">
      <h2 className="home__section-title">My Games</h2>
      <GameList games={games} onSelectGame={this.onSelectGame} />
    </div>
  );

  onSelectGame = game => {
    this.props.updatePath(`/games/${game.id}`);
  };

  render() {
    const isAuthenticated = !!this.props.player;
    const { playersGames, currentGames } = this.props;

    return (
      <div className="home">
        <div className="center-col">
          <div className="center-col__inner">
            <LoginStatusContainer />

            <Link className="button" to="/games/create">
              <StrokedText text="Create Game" />
            </Link>

            {isAuthenticated && playersGames.length ? (
              this.renderPlayersGames(playersGames)
            ) : (
              this.renderEmptyGamesPlaceholder()
            )}

            <div className="home__section">
              <h2 className="home__section-title">Current Games</h2>
              {currentGames.length === 0 ? (
                this.renderEmptyGamesPlaceholder()
              ) : (
                <GameList
                  games={currentGames}
                  onSelectGame={this.onSelectGame}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function isPlayerPartOfGame(game, playerId) {
  return game.players.some(p => p.id === playerId);
}

function canJoinGame(game) {
  return game.status === GameStatus.WAITING_FOR_PLAYERS;
}

function mapStateToProps(state) {
  // Should data massaging happen here ?
  const games = state.games || [];

  const player = state.authentication.player;
  const playerId = player ? player.id : undefined;
  const playersGames = games.filter(g => isPlayerPartOfGame(g, playerId));

  const currentGames = games.filter(
    g => canJoinGame(g) && !playersGames.some(g2 => g.id === g2.id)
  );

  return {
    playersGames,
    currentGames,
    player,
  };
}

export const HomeContainer = connect(mapStateToProps, {
  joinLobby,
  leaveLobby,
  updatePath,
})(Home);
