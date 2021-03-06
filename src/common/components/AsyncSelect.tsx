import * as React from "react";

import { 
	Button, 
	Intent, 
	IPopoverProps, 
	Spinner 
} from "@blueprintjs/core";

import { 
	ItemListPredicate, 
	ItemListRenderer, 
	ItemPredicate, 
	ItemRenderer, 
	Select
} from "@blueprintjs/select";

import { IAsyncStore } from "./AsyncStore";
import { CancelToken, ignoreCancel } from "./CancelToken";

export interface IAsyncSelectProps<T> {
	store: IAsyncStore<T>;
	buttonTextProvider: (selectedItem?: T) => string;
	fetchOnInitialize?: boolean;
	filterable?: boolean;
	disabled?: boolean;
	minimal?: boolean;
	intent?: Intent;
	resetOnSelect?: boolean;
	resetOnClose?: boolean;
	onQueryChange?: (query: string) => void;
	itemListPredicate?: ItemListPredicate<T>;
	itemPredicate?: ItemPredicate<T>;
	itemRenderer: ItemRenderer<T>;
	itemListRenderer?: ItemListRenderer<T>;
	initialContent?: React.ReactNode | null;
	noResults?: React.ReactNode;
	onItemSelect?: (item: T, event?: React.SyntheticEvent<HTMLElement>) => void;
	popoverProps?: IPopoverProps;
}

export interface IAsyncSelectState<T> {
	items?: T[];
	selectedItem?: T;
	loading: boolean;
}

export class AsyncSelect<T> extends React.PureComponent<IAsyncSelectProps<T>, IAsyncSelectState<T>> {
	public static ofType<T>() {
		return AsyncSelect as new (props: IAsyncSelectProps<T>) => AsyncSelect<T>;
	}

	public store: IAsyncStore<T>;
	private cancelSource = CancelToken.source();
	
	constructor(props: IAsyncSelectProps<T>, context?: any) {
		super(props, context);

		this.state = {
			items: undefined,
			loading: false
		}

		this.store = props.store;

		if (props.fetchOnInitialize !== false) {
			this.fetchAsync();
		}
	}

	public componentWillUnmount() {
		this.cancelSource.cancel('Unmounting');
	}

	public render() {
		const { items, loading, selectedItem } = this.state;

		const buttonProps = {
			disabled: this.props.disabled,
			intent: this.props.intent,
			minimal: this.props.minimal
		}

		if (loading) {
			return (
				<Button {...buttonProps} text="Loading..." rightIcon={<Spinner size={Spinner.SIZE_SMALL} intent={this.props.intent} />} disabled={true} />
			);
		} else if (items !== undefined) {
			const TypedSelect = Select.ofType<T>();
			
			const selectProps = {
				...this.props,
				items
			};

			const text = this.props.buttonTextProvider(selectedItem);

			return (
				<TypedSelect 
					{...selectProps}
					onItemSelect={this.onItemSelect}>
					<Button {...buttonProps} rightIcon="caret-down" text={text} />
				</TypedSelect>
			);
		} else {

			const text = this.props.buttonTextProvider();
			return (
				<Button {...buttonProps} rightIcon="caret-down" text={text} disabled={true} />
			);
		}
	}

	@ignoreCancel
	public async fetchAsync(cancelToken: CancelToken = CancelToken.never): Promise<void> {
		this.setState({ loading: true });

		const items = await this.store.fetchAsync();

		CancelToken.race(this.cancelSource.token, cancelToken).throwIfRequested();

		this.setState({ 
			items,
			loading: false, 
			selectedItem: undefined
		});
	}

	private onItemSelect = (selectedItem: T) => {
		this.setState({ selectedItem });

		if (this.props.onItemSelect) {
			this.props.onItemSelect(selectedItem);
		}
	}
}