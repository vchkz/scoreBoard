// App.jsx
import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { darkJoy, darkEva, darkSber } from '@salutejs/plasma-tokens/themes';
import { createGlobalStyle } from 'styled-components';

import GameScore from './GameScore';

const ThemeBackgroundEva = createGlobalStyle(darkEva);
const ThemeBackgroundSber = createGlobalStyle(darkSber);
const ThemeBackgroundJoy = createGlobalStyle(darkJoy);

const initializeAssistant = (getState /*: any*/, getRecoveryState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: 'гостям два балла',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  } else {
    return createAssistant({ getState });
  }
};

export class App extends React.Component {
  constructor(props) {
    super(props);
    console.log('constructor');

    this.state = {
      homeTeamName: "Хозяева",
      guestTeamName: "Гости",
      home: 0,
      guest: 0,
      character: 'sber',
    };

    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on('data', (event /*: any*/) => {
      console.log(`assistant.on(data)`, event);
      if (event.type === 'character') {
        console.log(`assistant.on(data): character: "${event?.character?.id}"`);
        this.setState({ character: event.character.id });
      } else if (event.type === 'insets') {
        console.log(`assistant.on(data): insets`);
      } else {
        const { action } = event;
        this.dispatchAssistantAction(action);
      }
    });

    this.assistant.on('start', (event) => {
      let initialData = this.assistant.getInitialData();

      console.log(`assistant.on(start)`, event, initialData);
    });

    this.assistant.on('command', (event) => {
      console.log(`assistant.on(command)`, event);
    });

    this.assistant.on('error', (event) => {
      console.log(`assistant.on(error)`, event);
    });

    this.assistant.on('tts', (event) => {
      console.log(`assistant.on(tts)`, event);
    });
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  getStateForAssistant() {
    console.log('getStateForAssistant: this.state:', this.state);
    const state = {
      item_selector: {
        items: {
          homeTeamName: this.state.homeTeamName,
          guestTeamName: this.state.guestTeamName,
          home_score: this.state.home,
          guest_score: this.state.guest,
        }
      },
    };
    console.log('getStateForAssistant: state:', state);
    return state;
  }

  async dispatchAssistantAction(action) {
    console.log('dispatchAssistantAction', action);
    if (action) {
      switch (action.responseType) {
        case 'changeScore':
          console.log('dispatch: addScore:', action);
          return await this.changeScore(action.teamName, action.addScore);
        case 'setScore':
          console.log('dispatch: setScore:', action.setScore);
          return await this.setScore(action.teamName, action.setScore);
        case 'changeName':
          console.log('dispatch: changeName:', action.teamName, action.UserTeamName);
          return this.changeTeamName(action.teamName, action.UserTeamName);
        default:
          throw new Error();
      }
    }
  }

  changeScore = (team, n) => {
    console.log('CHANGE SCORE: ', n);
    return new Promise((resolve) => {
      this.setState((prevState) => {
        const newScore = Number(prevState[team]) + Number(n);
        if (newScore > -100 && newScore < 1000) {
          return { [team]: newScore };
        } else {
          console.warn('New score out of bounds:', newScore);
          return null;
        }
      }, resolve);
    });
  }


  setScore = (team, n) => {
    console.log('SET SCORE: ', n);
    return new Promise((resolve) => {
      this.setState({
        [team]: Number(n)
      }, resolve);
    });
  }

  changeTeamName = (team, name) => {
    this.setState((prevState) => ({
      [team === 'home' ? 'homeTeamName' : 'guestTeamName']: name
    }));
  }

  manualChangeScore = async (action_id, team, score) => {
    await this.changeScore(team, score);

    console.log('кнопка нажата');

    const data = {
      action: {
        action_id: action_id,
        parameters: {
          firstTeamName: "Хозяева",
          secondTeamName: "Гости",
          firstTeamScore: this.state.home,
          secondTeamScore: this.state.guest,
        }
      },
    };



    const unsubscribe = this.assistant.sendData(data, (data) => {
      const { type, payload } = data;
      console.log('sendData onData:', type, payload);
      unsubscribe();
    });

    this.assistant.cancelTts();
  }

  render() {
    console.log('render');
    console.log('render: ', this.state);
    const { character } = this.state;
    return (
        <>
          {(() => {
            switch (character) {
              case 'sber':
                return <ThemeBackgroundSber />;
              case 'eva':
                return <ThemeBackgroundEva />;
              case 'joy':
                return <ThemeBackgroundJoy />;
              default:
                return <ThemeBackgroundSber />;
            }
          })()}
          <GameScore
              homeScore={this.state.home}
              guestScore={this.state.guest}
              homeTeamName={this.state.homeTeamName}
              guestTeamName={this.state.guestTeamName}
              manualChangeScore={this.manualChangeScore}
          />
        </>
    );
  }
}
