import React from 'react';
import { GarmentGlyph as GarmentGlyphName } from '../../../config/cycleConfig';
import SockGlyph from './SockGlyph';
import TeeGlyph from './TeeGlyph';

const GLYPHS: Record<GarmentGlyphName, React.FC> = {
    tee: TeeGlyph,
    sock: SockGlyph,
};

/** Picks the garment a headline segment asks for. */
const GarmentGlyph: React.FC<{ name: GarmentGlyphName }> = ({ name }) => {
    const Glyph = GLYPHS[name];
    return <Glyph />;
};

export default GarmentGlyph;
