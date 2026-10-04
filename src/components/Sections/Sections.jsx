import { SECTIONS } from '../../data/sections.js';
import Hero from '../Hero/Hero.jsx';
import Section from './Section.jsx';

export default function Sections() {
  return (
    <>
      {SECTIONS.map((s) =>
        s.id === 'hero' ? (
          <Hero key={s.id} label={s.label} title={s.title} body={s.body} />
        ) : (
          <Section key={s.id} id={s.id} label={s.label} title={s.title} body={s.body} />
        )
      )}
    </>
  );
}
