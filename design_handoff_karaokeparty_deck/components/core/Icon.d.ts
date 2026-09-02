export type IconName =
  | 'ACCOUNT' | 'ACCOUNT_BOX' | 'ACCOUNT_BOX_OUTLINE' | 'ALERT_OUTLINE'
  | 'CHEVRON_DOWN' | 'CHEVRON_LEFT' | 'CHEVRON_RIGHT' | 'CHEVRON_UP'
  | 'CIRCLE' | 'CLEAR' | 'CLOUD' | 'DELETE' | 'DICE' | 'DRAG_INDICATOR'
  | 'FLAG' | 'FOLDER' | 'FOLDER_MUSIC' | 'FULLSCREEN'
  | 'GITHUB_REPO' | 'GITHUB_SPONSOR' | 'GITHUB_STAR'
  | 'INFO_OUTLINE' | 'LABEL' | 'MAGNIFIER' | 'MORE_HORIZ' | 'MOVE_TOP'
  | 'NAV_ACCOUNT' | 'NAV_ACCOUNT_ACTIVE' | 'NAV_LIBRARY' | 'NAV_SUBSCRIPTIONS'
  | 'PAUSE' | 'PLAY' | 'PLAY_NEXT' | 'PLUS' | 'PERSON' | 'PHOTO_ADD'
  | 'QR_CODE' | 'REFRESH' | 'REPLAY' | 'STAR_FULL' | 'TELEVISION_PLAY' | 'TUNE'
  | 'VISIBILITY' | 'VISIBILITY_OFF'
  | 'VOLUME_DOWN' | 'VOLUME_MUTE' | 'VOLUME_OFF' | 'VOLUME_UP'

export interface IconProps {
  /** Name from the built-in set. Unknown names render nothing. */
  icon: IconName
  /** Rendered height in px. Width follows the viewBox. Omit to inherit from CSS. */
  size?: number
  className?: string
  style?: React.CSSProperties
}

export const ICON_NAMES: IconName[]
export function Icon (props: IconProps): JSX.Element | null
