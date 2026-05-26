import createIconSet from '@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set';
import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';

/**
 * Ionicons via @expo/vector-icons, loaded from native font file.
 * Android expects assets/fonts/ionicons.ttf (see postinstall script).
 */
const Ionicons = createIconSet(glyphMap, 'Ionicons', 'ionicons.ttf');

export default Ionicons;
