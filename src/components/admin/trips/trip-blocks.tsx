"use client";

import type { AudienceBlock, Localized } from "@/lib/content/types";
import type { TripDraft } from "@/lib/firebase/trips";
import {
  LocalizedInput,
  LocalizedLines,
  LocalizedTextarea,
} from "../fields";
import { useAdmin } from "../i18n";
import { Repeatable } from "../repeatable";
import { OptionalSection } from "./section";

/**
 * The optional text blocks of §6.3: price, the place, who it suits, what you
 * get, how to prepare, the programme, rules and the FAQ.
 *
 * Each one is a block the owner adds or does not, because §6.3 says an unfilled
 * block is not rendered — the form therefore has no "empty but present" state
 * for any of them.
 */

const noText = (): Localized<string> => ({ en: "", ru: "" });
const noLines = (): Localized<string[]> => ({ en: [], ru: [] });

export function TripBlocks({
  draft,
  set,
}: {
  draft: TripDraft;
  set: <K extends keyof TripDraft>(key: K, value: TripDraft[K]) => void;
}) {
  const { t } = useAdmin();

  return (
    <>
      <OptionalSection
        id="block-price"
        title={t.tripForm.price.title}
        subtitle={t.tripForm.price.subtitle}
        value={draft.price}
        onChange={(value) => set("price", value)}
        create={() => ({ amount: noText(), included: noLines(), notIncluded: noLines() })}
      >
        {(price, update) => (
          <>
            <LocalizedInput
              id="price-amount"
              label={t.tripForm.priceAmount}
              value={price.amount}
              onChange={(amount) => update({ ...price, amount })}
              placeholder="$3,500"
              hint={t.tripForm.priceAmountHint}
            />
            <LocalizedLines
              id="price-included"
              label={t.tripForm.priceIncluded}
              value={price.included}
              onChange={(included) => update({ ...price, included })}
              hint={t.tripForm.priceIncludedHint}
            />
            <LocalizedLines
              id="price-not-included"
              label={t.tripForm.priceNotIncluded}
              value={price.notIncluded}
              onChange={(notIncluded) => update({ ...price, notIncluded })}
            />
          </>
        )}
      </OptionalSection>

      <OptionalSection
        id="block-place"
        title={t.tripForm.placeBlock.title}
        subtitle={t.tripForm.placeBlock.subtitle}
        value={draft.placeDetails}
        onChange={(value) => set("placeDetails", value)}
        create={() => ({ paragraphs: noLines() })}
      >
        {(place, update) => (
          <LocalizedLines
            id="place-paragraphs"
            label={t.tripForm.placeParagraphs}
            rows={8}
            value={place.paragraphs}
            onChange={(paragraphs) => update({ paragraphs })}
            hint={t.tripForm.placeParagraphsHint}
          />
        )}
      </OptionalSection>

      <OptionalSection
        id="block-audience"
        title={t.tripForm.audience.title}
        subtitle={t.tripForm.audience.subtitle}
        value={draft.audience}
        onChange={(value) => set("audience", value)}
        create={(): AudienceBlock => ({ items: noLines() })}
      >
        {(audience, update) => (
          <>
            <LocalizedLines
              id="audience-items"
              label={t.tripForm.audienceItems}
              rows={7}
              value={audience.items}
              onChange={(items) => update({ ...audience, items })}
            />
            <LocalizedTextarea
              id="audience-note"
              label={t.tripForm.note}
              rows={3}
              value={audience.note ?? noText()}
              onChange={(note) => update({ ...audience, note })}
            />
          </>
        )}
      </OptionalSection>

      <CardsBlock
        id="block-what-you-get"
        copy={t.tripForm.whatYouGet}
        max={6}
        value={draft.whatYouGet}
        onChange={(value) => set("whatYouGet", value)}
        prefix="what"
      />

      <CardsBlock
        id="block-prepare"
        copy={t.tripForm.howToPrepare}
        value={draft.howToPrepare}
        onChange={(value) => set("howToPrepare", value)}
        prefix="prep"
      />

      <OptionalSection
        id="block-program"
        title={t.tripForm.program.title}
        subtitle={t.tripForm.program.subtitle}
        value={draft.program}
        onChange={(value) => set("program", value)}
        create={() => ({ stages: [] })}
      >
        {(program, update) => (
          <>
            <Repeatable
              items={program.stages}
              onChange={(stages) => update({ ...program, stages })}
              create={() => ({ duration: noText(), place: noText(), text: noText() })}
              itemLabel={(index) => t.tripForm.stage(index + 1)}
              addLabel={t.tripForm.stageAdd}
              empty={t.tripForm.stagesEmpty}
              render={(stage, update2, index) => (
                <>
                  <LocalizedInput
                    id={`stage-${index}-duration`}
                    label={t.tripForm.stageDuration}
                    value={stage.duration}
                    onChange={(duration) => update2({ ...stage, duration })}
                    placeholder="Days 1–3"
                  />
                  <LocalizedInput
                    id={`stage-${index}-place`}
                    label={t.tripForm.stagePlace}
                    value={stage.place}
                    onChange={(place) => update2({ ...stage, place })}
                  />
                  <LocalizedTextarea
                    id={`stage-${index}-text`}
                    label={t.tripForm.stageText}
                    rows={3}
                    value={stage.text}
                    onChange={(text) => update2({ ...stage, text })}
                  />
                </>
              )}
            />
            <LocalizedTextarea
              id="program-note"
              label={t.tripForm.programNote}
              rows={2}
              value={program.note ?? noText()}
              onChange={(note) => update({ ...program, note })}
            />
          </>
        )}
      </OptionalSection>

    </>
  );
}

/**
 * The two blocks that close a trip page, after the route, the gallery and the
 * crew. Separate from the ones above only so the form is filled in the order
 * the page reads.
 */
export function TripClosingBlocks({
  draft,
  set,
}: {
  draft: TripDraft;
  set: <K extends keyof TripDraft>(key: K, value: TripDraft[K]) => void;
}) {
  const { t } = useAdmin();

  return (
    <>
      <OptionalSection
        id="block-rules"
        title={t.tripForm.rules.title}
        subtitle={t.tripForm.rules.subtitle}
        value={draft.rules}
        onChange={(value) => set("rules", value)}
        create={() => ({ title: noText(), text: noText() })}
      >
        {(rules, update) => (
          <>
            <LocalizedInput
              id="rules-title"
              label={t.tripForm.rulesTitle}
              value={rules.title}
              onChange={(title) => update({ ...rules, title })}
            />
            <LocalizedTextarea
              id="rules-text"
              label={t.tripForm.rulesText}
              rows={6}
              value={rules.text}
              onChange={(text) => update({ ...rules, text })}
            />
          </>
        )}
      </OptionalSection>

      <div
        id="block-faq"
        className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="font-display text-lg">{t.tripForm.faq.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.tripForm.faq.subtitle}</p>
        <div className="mt-5">
          <Repeatable
            items={draft.faq}
            onChange={(faq) => set("faq", faq)}
            create={() => ({ question: noText(), answer: noText() })}
            itemLabel={(index) => t.tripForm.question(index + 1)}
            addLabel={t.tripForm.questionAdd}
            empty={t.tripForm.questionsEmpty}
            render={(item, update, index) => (
              <>
                <LocalizedInput
                  id={`faq-${index}-question`}
                  label={t.tripForm.faqQuestion}
                  value={item.question}
                  onChange={(question) => update({ ...item, question })}
                />
                <LocalizedTextarea
                  id={`faq-${index}-answer`}
                  label={t.tripForm.faqAnswer}
                  rows={3}
                  value={item.answer}
                  onChange={(answer) => update({ ...item, answer })}
                />
              </>
            )}
          />
        </div>
      </div>
    </>
  );
}

/** "What you get" and "How to prepare" are the same shape with different copy. */
function CardsBlock({
  id,
  copy,
  value,
  onChange,
  prefix,
  max,
}: {
  id: string;
  /** This block's heading and explanation, in the panel's language. */
  copy: { title: string; subtitle: string };
  value: TripDraft["whatYouGet"];
  onChange: (value: TripDraft["whatYouGet"]) => void;
  prefix: string;
  max?: number;
}) {
  const { t } = useAdmin();

  return (
    <OptionalSection
      id={id}
      title={copy.title}
      subtitle={copy.subtitle}
      value={value}
      onChange={onChange}
      create={() => ({ cards: [] })}
    >
      {(block, update) => (
        <>
          <Repeatable
            items={block.cards}
            onChange={(cards) => update({ ...block, cards })}
            create={() => ({ title: noText(), text: noText() })}
            itemLabel={(index) => t.tripForm.card(index + 1)}
            addLabel={t.tripForm.cardAdd}
            empty={t.tripForm.cardsEmpty}
            max={max}
            render={(card, update2, index) => (
              <>
                <LocalizedInput
                  id={`${prefix}-${index}-title`}
                  label={t.tripForm.cardTitle}
                  value={card.title}
                  onChange={(cardTitle) => update2({ ...card, title: cardTitle })}
                />
                <LocalizedTextarea
                  id={`${prefix}-${index}-text`}
                  label={t.tripForm.cardText}
                  rows={3}
                  value={card.text}
                  onChange={(text) => update2({ ...card, text })}
                />
              </>
            )}
          />
          <LocalizedTextarea
            id={`${prefix}-note`}
            label={t.tripForm.note}
            rows={2}
            value={block.note ?? noText()}
            onChange={(note) => update({ ...block, note })}
          />
        </>
      )}
    </OptionalSection>
  );
}
