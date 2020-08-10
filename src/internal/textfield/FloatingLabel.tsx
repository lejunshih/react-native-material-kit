/**
 * `FloatingLabel` component of {@link Textfield}s.
 */
import React, { Component, createRef } from 'react';
import {
  Animated,
  findNodeHandle,
  LayoutChangeEvent,
  MeasureOnSuccessCallback,
  TextStyle,
  UIManager,
} from 'react-native';

import MKColor from '../../MKColor';
import { Dimension } from '../../types';

/** Public props of {@link FloatingLabel} */
export interface FloatingLabelPublicProps {
  /** Enable floating label effect */
  floatingLabelEnabled?: boolean;

  /** Duration of floating transition, also affect underline animation */
  floatingLabelAniDuration?: number;

  /** Spacing between floating label and input text */
  floatingLabelBottomMargin?: number;

  /** {@link TextStyle} of floating label */
  floatingLabelFont?: TextStyle;
}

/** Internal Props of {@link FloatingLabel} */
export interface FloatingLabelProps extends FloatingLabelPublicProps {
  /** The initial label text */
  label: string;
  tint?: any;
  highlightColor?: any;
  opacityAniDur?: number;

  /** Specifies should fonts scale to respect Text Size accessibility setting on iOS. */
  allowFontScaling?: boolean;
}

/** State of {@link FloatingLabel} */
interface FloatingLabelState {
  progress: Animated.Value;
  opacity: Animated.Value;
  label: string;
}

/** Defaults of {@link FloatingLabelProps} */
const defaultProps: Partial<FloatingLabelProps> = {
  floatingLabelEnabled: true,
  floatingLabelAniDuration: 200,
  opacityAniDur: 0,
};

/**
 * The `FloatingLabel` component of a {@link Textfield}.
 */
export default class FloatingLabel extends Component<FloatingLabelProps, FloatingLabelState> {
  /** Defaults, see {@link defaultProps} */
  static defaultProps = defaultProps;

  private labelDim: Dimension;
  private offsetX = 0;
  private placeholderHeight = 0;
  private labelRef = createRef<Component>();

  constructor(props: FloatingLabelProps) {
    super(props);
    this.labelDim = { width: 0, height: 0 };
    this.state = {
      progress: new Animated.Value(1),
      opacity: new Animated.Value(0),
      label: '',
    };
  }

  UNSAFE_componentWillMount() {
    this.updateLabel(this.props.label);
  }

  UNSAFE_componentWillReceiveProps(nextProps: FloatingLabelProps) {
    this.updateLabel(nextProps.label);
  }

  /** Update the label text */
  updateLabel(label?: string) {
    this.setState({ label: label || '' });
  }

  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback.
   */
  measure(cb: MeasureOnSuccessCallback) {
    if (this.labelRef.current) {
      const handle = findNodeHandle(this.labelRef.current);
      handle && UIManager.measure(handle, cb);
    }
  }

  /** Start the floating animation */
  aniFloatLabel(): Animated.CompositeAnimation[] {
    return this.props.floatingLabelEnabled
      ? [
        Animated.sequence([
          Animated.timing(this.state.opacity, {
            toValue: 1,
            duration: this.props.opacityAniDur,
            useNativeDriver: true,
          }),
          Animated.timing(this.state.progress, {
            toValue: 0,
            duration: this.props.floatingLabelAniDuration,
            useNativeDriver: true,
          }),
        ]),
      ]
      : [];
  }

  /** Start the collapse animation */
  aniSinkLabel(): Animated.CompositeAnimation[] {
    return this.props.floatingLabelEnabled
      ? [
        Animated.sequence([
          Animated.timing(this.state.progress, {
            toValue: 1,
            duration: this.props.floatingLabelAniDuration,
            useNativeDriver: true,
          }),
          Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: this.props.opacityAniDur,
            useNativeDriver: true,
          }),
        ]),
      ]
      : [];
  }

  render() {
    const labelColor = this.state.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [this.props.highlightColor, this.props.tint],
    });

    const labelScale = this.state.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const labelY = this.state.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, this.placeholderHeight],
    });

    const labelX = this.state.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [this.offsetX, 0],
    });

    return (
      <Animated.Text
        {...{ ref: this.labelRef } as any}
        pointerEvents="none"
        allowFontScaling={this.props.allowFontScaling}
        style={[
          {
            backgroundColor: MKColor.Transparent,
            position: 'absolute',
            top: labelY,
            left: labelX,
            color: labelColor,
            opacity: this.state.opacity,
            fontSize: 16,
            transform: [{ scale: labelScale }],
            marginBottom: this.props.floatingLabelBottomMargin,
          },
          this.props.floatingLabelFont,
        ]}
        onLayout={this._onLabelLayout}
      >
        {this.state.label}
      </Animated.Text>
    );
  }

  private _onLabelLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const { x, width, height } = layout;

    if (width && !this.offsetX) {
      this.offsetX = (-1 * (width - width * 0.8)) / 2 - x;
    }

    if (height && !this.placeholderHeight) {
      this.placeholderHeight = height;
    }

    if (width !== this.labelDim.width || height !== this.labelDim.height) {
      this.labelDim = { width, height };
    }
  };
}
