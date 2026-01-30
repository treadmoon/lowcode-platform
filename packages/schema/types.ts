export type ActionType = 'UpdateState' | 'Request' | 'Navigate' | 'AI';

export interface BaseAction {
  type: ActionType;
}

export interface UpdateStateAction extends BaseAction {
  type: 'UpdateState';
  path: string;
  value: any;
}

export interface RequestAction extends BaseAction {
  type: 'Request';
  method: 'GET' | 'POST';
  url: string; // Mock URL
  body?: any;
  responseMapping?: Record<string, string>; // e.g. "data.user": "state.user"
}

export interface NavigateAction extends BaseAction {
  type: 'Navigate';
  path: string;
}

export interface AIAction extends BaseAction {
  type: 'AI';
  prompt: string;
  outputStatePath: string; // Where to put the result
}

export type Action = 
  | UpdateStateAction 
  | RequestAction 
  | NavigateAction 
  | AIAction;

export interface ActionFlow {
  id: string;
  trigger: string; // e.g. "onClick"
  actions: Action[];
}

export interface ComponentSchema {
  id: string;
  type: 'Text' | 'Button' | 'Input'; // Extended slightly for utility
  props: Record<string, any>;
  bindState?: string; // path in state
  onEvent?: Record<string, string>; // eventName -> flowId. NOTE: Spec said 'onEvent?: string' (actionId) - assuming flowId based on "Action Flow 规范"
}

export interface PageSchema {
  id: string;
  path: string;
  components: ComponentSchema[];
  actions: ActionFlow[]; // Local definition of flows
}

export interface AppSchema {
  pages: PageSchema[];
  initialState: Record<string, any>;
}
