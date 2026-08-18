import Phaser from 'phaser';
import type { User } from '@supabase/supabase-js';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  getAuthUnavailableReason,
  getCurrentUser,
  isDeveloperAccount,
  onAuthChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '../cloud/auth';
import {
  DEFAULT_PLAYER_NAME,
  getPlayerName,
  MAX_PLAYER_NAME_LENGTH,
  setPlayerName,
} from '../cloud/playerName';
import { disablePhaserKeyboardWhileTyping } from '../editor/ui/editorWidgets';
import { unlockAllForDeveloper } from '../developerUnlock';
import { createMenuButton } from './MenuButtons';

const ACCOUNT_BUTTON_HIT_AREA = new Phaser.Geom.Rectangle(-110, -24, 220, 48);

function setAccountButtonVisible(container: Phaser.GameObjects.Container, visible: boolean): void {
  container.setVisible(visible);
  if (visible) {
    container.setInteractive(ACCOUNT_BUTTON_HIT_AREA, Phaser.Geom.Rectangle.Contains);
    if (container.input) container.input.cursor = 'pointer';
  } else {
    container.disableInteractive();
  }
}

export interface AccountPanelOptions {
  onBack: () => void;
  onAuthChange?: (user: User | null) => void;
}

export interface AccountPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

function styleAccountInput(el: HTMLInputElement): void {
  el.style.cssText = [
    'width:280px',
    'height:40px',
    'box-sizing:border-box',
    'border:1px solid #334466',
    'border-radius:10px',
    'background:#1a1f3a',
    'color:#e8f4ff',
    'font-family:Orbitron,sans-serif',
    'font-size:13px',
    'font-weight:700',
    'outline:none',
    'padding:0 12px',
  ].join(';');
}

function createInput(scene: Phaser.Scene, type: string, placeholder: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name';
  input.spellcheck = false;
  styleAccountInput(input);
  input.addEventListener('pointerdown', (event) => event.stopPropagation());
  input.addEventListener('mousedown', (event) => event.stopPropagation());
  input.addEventListener('touchstart', (event) => event.stopPropagation());
  disablePhaserKeyboardWhileTyping(scene, input);
  return input;
}

function formatUserLabel(user: User | null): string {
  if (!user) return 'Not signed in';
  return getPlayerName(user);
}

export function getAccountChipLabel(user: User | null): string {
  if (!user) return 'LOG IN';
  const name = getPlayerName(user);
  return name.length > 18 ? `${name.slice(0, 16)}…` : name;
}

export function createAccountPanel(
  scene: Phaser.Scene,
  depth: number,
  options: AccountPanelOptions,
): AccountPanelResult {
  const root = scene.add.container(0, 0).setDepth(depth);
  const configMessage = getAuthUnavailableReason();
  let busy = false;

  const overlay = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.85,
  );
  root.add(overlay);

  const title = scene.add.text(GAME_WIDTH / 2, 70, 'ACCOUNT', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '32px',
    fontStyle: '900',
    color: '#00d4ff',
  }).setOrigin(0.5);
  root.add(title);

  const status = scene.add.text(GAME_WIDTH / 2, 118, 'Loading…', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    color: '#ffcc00',
    align: 'center',
    wordWrap: { width: GAME_WIDTH - 48 },
  }).setOrigin(0.5);
  root.add(status);

  const hint = scene.add.text(
    GAME_WIDTH / 2,
    160,
    'Sign in with email to save coins, unlocks, and shop items to the cloud.',
    {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#8899bb',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 56 },
      lineSpacing: 6,
    },
  ).setOrigin(0.5, 0);
  root.add(hint);

  const emailInput = createInput(scene, 'email', 'Email');
  const passwordInput = createInput(scene, 'password', 'Password');
  const nameInput = createInput(scene, 'text', 'Player name');
  nameInput.maxLength = MAX_PLAYER_NAME_LENGTH;
  nameInput.value = DEFAULT_PLAYER_NAME;
  const emailDom = scene.add.dom(GAME_WIDTH / 2, 250, emailInput).setOrigin(0.5);
  const passwordDom = scene.add.dom(GAME_WIDTH / 2, 302, passwordInput).setOrigin(0.5);
  const nameDom = scene.add.dom(GAME_WIDTH / 2, 250, nameInput).setOrigin(0.5);
  root.add(emailDom);
  root.add(passwordDom);
  root.add(nameDom);
  nameDom.setVisible(false);

  const message = scene.add.text(GAME_WIDTH / 2, 370, configMessage ?? '', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '12px',
    color: configMessage ? '#ff8866' : '#8899bb',
    align: 'center',
    wordWrap: { width: GAME_WIDTH - 48 },
  }).setOrigin(0.5, 0);
  root.add(message);

  const setMessage = (text: string, color = '#8899bb') => {
    message.setColor(color);
    message.setText(text);
  };

  const { container: renameBtn } = createMenuButton(scene, {
    label: 'RENAME',
    y: 318,
    color: 0xffcc00,
    onClick: () => {
      void submit('rename');
    },
  });
  renameBtn.setX(GAME_WIDTH / 2);
  root.add(renameBtn);

  const { container: signInBtn } = createMenuButton(scene, {
    label: 'SIGN IN',
    y: 430,
    onClick: () => {
      void submit('signin');
    },
  });
  signInBtn.setX(GAME_WIDTH / 2);
  root.add(signInBtn);

  const { container: signUpBtn } = createMenuButton(scene, {
    label: 'CREATE ACCOUNT',
    y: 492,
    color: 0xffcc00,
    onClick: () => {
      void submit('signup');
    },
  });
  signUpBtn.setX(GAME_WIDTH / 2);
  root.add(signUpBtn);

  const { container: signOutBtn } = createMenuButton(scene, {
    label: 'SIGN OUT',
    y: 430,
    color: 0xff4466,
    onClick: () => {
      void submit('signout');
    },
  });
  signOutBtn.setX(GAME_WIDTH / 2);
  root.add(signOutBtn);

  const { container: unlockAllBtn } = createMenuButton(scene, {
    label: 'UNLOCK ALL',
    y: 492,
    color: 0xffcc00,
    onClick: () => {
      void submit('unlockAll');
    },
  });
  unlockAllBtn.setX(GAME_WIDTH / 2);
  root.add(unlockAllBtn);

  const { container: backBtn } = createMenuButton(scene, {
    label: 'BACK',
    y: GAME_HEIGHT - 70,
    onClick: () => options.onBack(),
  });
  backBtn.setX(GAME_WIDTH / 2);
  root.add(backBtn);

  const showSignedOut = () => {
    emailDom.setVisible(true);
    passwordDom.setVisible(true);
    nameDom.setVisible(false);
    setAccountButtonVisible(signInBtn, true);
    setAccountButtonVisible(signUpBtn, true);
    setAccountButtonVisible(renameBtn, false);
    setAccountButtonVisible(signOutBtn, false);
    setAccountButtonVisible(unlockAllBtn, false);
    hint.setText('Sign in with email to save coins, unlocks, and shop items to the cloud.');
  };

  const showSignedIn = (user: User) => {
    emailDom.setVisible(false);
    passwordDom.setVisible(false);
    nameDom.setVisible(true);
    nameInput.value = getPlayerName(user);
    setAccountButtonVisible(signInBtn, false);
    setAccountButtonVisible(signUpBtn, false);
    setAccountButtonVisible(renameBtn, true);
    setAccountButtonVisible(signOutBtn, true);
    setAccountButtonVisible(unlockAllBtn, isDeveloperAccount(user));
    hint.setText(
      isDeveloperAccount(user)
        ? 'Developer account. Unlock All grants every level, secret, skin, shape, and max power-up.'
        : 'Progress on this device is saved to your account while you stay signed in.',
    );
  };

  const renderUser = (user: User | null) => {
    status.setText(formatUserLabel(user));
    if (user) showSignedIn(user);
    else showSignedOut();
  };

  const submit = async (mode: 'signin' | 'signup' | 'signout' | 'unlockAll' | 'rename') => {
    if (busy) return;
    if (configMessage) {
      setMessage(configMessage, '#ff8866');
      return;
    }

    busy = true;
    setMessage(
      mode === 'signout'
        ? 'Signing out…'
        : mode === 'unlockAll'
          ? 'Unlocking…'
          : mode === 'rename'
            ? 'Saving name…'
            : 'Working…',
      '#ffcc00',
    );

    try {
      if (mode === 'unlockAll') {
        const error = await unlockAllForDeveloper();
        if (error) {
          setMessage(error, '#ff8866');
          return;
        }
        setMessage('Everything unlocked. Shop, story, and secrets are now open.', '#7dffb3');
        return;
      }

      if (mode === 'rename') {
        const error = await setPlayerName(nameInput.value);
        if (error) {
          setMessage(error, '#ff8866');
          return;
        }
        const user = await getCurrentUser();
        nameInput.value = getPlayerName(user);
        setMessage('Name saved.', '#7dffb3');
        renderUser(user);
        return;
      }

      if (mode === 'signout') {
        const error = await signOut();
        if (error) {
          setMessage(error, '#ff8866');
          return;
        }
        passwordInput.value = '';
        setMessage('Signed out. Progress stays on this device.', '#8899bb');
        renderUser(null);
        options.onAuthChange?.(null);
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        setMessage('Enter an email and password.', '#ff8866');
        return;
      }
      if (password.length < 6) {
        setMessage('Password must be at least 6 characters.', '#ff8866');
        return;
      }

      const error = mode === 'signin'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

      if (error) {
        const confirmHint = error.toLowerCase().includes('check your email');
        setMessage(error, confirmHint ? '#ffcc00' : '#ff8866');
        return;
      }

      const user = await getCurrentUser();
      passwordInput.value = '';
      setMessage('Progress synced.', '#7dffb3');
      renderUser(user);
      options.onAuthChange?.(user);
    } finally {
      busy = false;
    }
  };

  if (configMessage) {
    emailDom.setVisible(false);
    passwordDom.setVisible(false);
    nameDom.setVisible(false);
    setAccountButtonVisible(signInBtn, false);
    setAccountButtonVisible(signUpBtn, false);
    setAccountButtonVisible(renameBtn, false);
    setAccountButtonVisible(signOutBtn, false);
    setAccountButtonVisible(unlockAllBtn, false);
    status.setText('Cloud save unavailable');
    hint.setText(configMessage);
  } else {
    showSignedOut();
    void getCurrentUser().then((user) => {
      if (!root.active) return;
      renderUser(user);
    });
  }

  const unsubscribe = onAuthChange((user) => {
    if (!root.active) return;
    renderUser(user);
  });

  const destroy = () => {
    unsubscribe();
    emailInput.remove();
    passwordInput.remove();
    nameInput.remove();
    root.destroy();
  };

  return { root, destroy };
}
