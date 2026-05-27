import React from 'react';
import { type PluginStore } from '../../types/plugins.js';
import ProfileList from '../plugins/profileList.js';

interface ProfilesCommandProps {
	store: PluginStore;
	onSave: (store: PluginStore) => void;
	onBack: () => void;
}

export default function ProfilesCommand({ store, onSave, onBack }: ProfilesCommandProps): React.JSX.Element {
	return (
		<ProfileList
			store={store}
			onSave={onSave}
			onBack={onBack}
		/>
	);
}
