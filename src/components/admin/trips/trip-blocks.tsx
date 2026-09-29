"use client";

import type { AudienceBlock, Localized } from "@/lib/content/types";
import type { TripDraft } from "@/lib/firebase/trips";
import {
  LocalizedInput,
  LocalizedLines,
  LocalizedTextarea,
} from "../fields";
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
  return (
    <>
      <OptionalSection
        id="block-price"
        title="Цена"
        subtitle="Заголовок на сайте — «Price»."
        value={draft.price}
        onChange={(value) => set("price", value)}
        create={() => ({ amount: noText(), included: noLines(), notIncluded: noLines() })}
      >
        {(price, update) => (
          <>
            <LocalizedInput
              id="price-amount"
              label="Сумма"
              value={price.amount}
              onChange={(amount) => update({ ...price, amount })}
              placeholder="$3,500"
              hint="Обычный текст, а не число: «$3,500» и «3500 $» пишутся по-разному."
            />
            <LocalizedLines
              id="price-included"
              label="Что входит в цену"
              value={price.included}
              onChange={(included) => update({ ...price, included })}
              hint="По одному пункту на строку."
            />
            <LocalizedLines
              id="price-not-included"
              label="Что не входит"
              value={price.notIncluded}
              onChange={(notIncluded) => update({ ...price, notIncluded })}
            />
          </>
        )}
      </OptionalSection>

      <OptionalSection
        id="block-place"
        title="Место"
        subtitle="Заголовок на сайте — «The place». Два-четыре абзаца."
        value={draft.placeDetails}
        onChange={(value) => set("placeDetails", value)}
        create={() => ({ paragraphs: noLines() })}
      >
        {(place, update) => (
          <LocalizedLines
            id="place-paragraphs"
            label="Описание места"
            rows={8}
            value={place.paragraphs}
            onChange={(paragraphs) => update({ paragraphs })}
            hint="Пустая строка разделяет абзацы не нужна — каждый абзац на своей строке."
          />
        )}
      </OptionalSection>

      <OptionalSection
        id="block-audience"
        title="Кому подходит"
        subtitle="Заголовок на сайте — «Is this trip for you?»."
        value={draft.audience}
        onChange={(value) => set("audience", value)}
        create={(): AudienceBlock => ({ items: noLines() })}
      >
        {(audience, update) => (
          <>
            <LocalizedLines
              id="audience-items"
              label="Пункты списка"
              rows={7}
              value={audience.items}
              onChange={(items) => update({ ...audience, items })}
            />
            <LocalizedTextarea
              id="audience-note"
              label="Примечание"
              rows={3}
              value={audience.note ?? noText()}
              onChange={(note) => update({ ...audience, note })}
            />
          </>
        )}
      </OptionalSection>

      <CardsBlock
        id="block-what-you-get"
        title="Что получишь"
        subtitle="Заголовок на сайте — «What you get». От одной до шести карточек."
        max={6}
        value={draft.whatYouGet}
        onChange={(value) => set("whatYouGet", value)}
        prefix="what"
      />

      <CardsBlock
        id="block-prepare"
        title="Подготовка"
        subtitle="Заголовок на сайте — «How to prepare»."
        value={draft.howToPrepare}
        onChange={(value) => set("howToPrepare", value)}
        prefix="prep"
      />

      <OptionalSection
        id="block-program"
        title="Программа по этапам"
        subtitle="Заголовок на сайте — «Program»."
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
              itemLabel={(index) => `Этап ${index + 1}`}
              addLabel="Добавить этап"
              empty="Этапов пока нет."
              render={(stage, update2, index) => (
                <>
                  <LocalizedInput
                    id={`stage-${index}-duration`}
                    label="Длительность"
                    value={stage.duration}
                    onChange={(duration) => update2({ ...stage, duration })}
                    placeholder="Days 1–3"
                  />
                  <LocalizedInput
                    id={`stage-${index}-place`}
                    label="Место"
                    value={stage.place}
                    onChange={(place) => update2({ ...stage, place })}
                  />
                  <LocalizedTextarea
                    id={`stage-${index}-text`}
                    label="Описание"
                    rows={3}
                    value={stage.text}
                    onChange={(text) => update2({ ...stage, text })}
                  />
                </>
              )}
            />
            <LocalizedTextarea
              id="program-note"
              label="Примечание к программе"
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
  return (
    <>
      <OptionalSection
        id="block-rules"
        title="Формат и правила"
        subtitle="Заголовок на сайте — «Rules & safety»."
        value={draft.rules}
        onChange={(value) => set("rules", value)}
        create={() => ({ title: noText(), text: noText() })}
      >
        {(rules, update) => (
          <>
            <LocalizedInput
              id="rules-title"
              label="Заголовок"
              value={rules.title}
              onChange={(title) => update({ ...rules, title })}
            />
            <LocalizedTextarea
              id="rules-text"
              label="Текст"
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
        <h3 className="font-display text-lg">Вопросы и ответы</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Заголовок на сайте — «FAQ». Если пар нет, блок не появится.
        </p>
        <div className="mt-5">
          <Repeatable
            items={draft.faq}
            onChange={(faq) => set("faq", faq)}
            create={() => ({ question: noText(), answer: noText() })}
            itemLabel={(index) => `Вопрос ${index + 1}`}
            addLabel="Добавить вопрос"
            empty="Вопросов пока нет."
            render={(item, update, index) => (
              <>
                <LocalizedInput
                  id={`faq-${index}-question`}
                  label="Вопрос"
                  value={item.question}
                  onChange={(question) => update({ ...item, question })}
                />
                <LocalizedTextarea
                  id={`faq-${index}-answer`}
                  label="Ответ"
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
  title,
  subtitle,
  value,
  onChange,
  prefix,
  max,
}: {
  id: string;
  title: string;
  subtitle: string;
  value: TripDraft["whatYouGet"];
  onChange: (value: TripDraft["whatYouGet"]) => void;
  prefix: string;
  max?: number;
}) {
  return (
    <OptionalSection
      id={id}
      title={title}
      subtitle={subtitle}
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
            itemLabel={(index) => `Карточка ${index + 1}`}
            addLabel="Добавить карточку"
            empty="Карточек пока нет."
            max={max}
            render={(card, update2, index) => (
              <>
                <LocalizedInput
                  id={`${prefix}-${index}-title`}
                  label="Заголовок"
                  value={card.title}
                  onChange={(cardTitle) => update2({ ...card, title: cardTitle })}
                />
                <LocalizedTextarea
                  id={`${prefix}-${index}-text`}
                  label="Текст"
                  rows={3}
                  value={card.text}
                  onChange={(text) => update2({ ...card, text })}
                />
              </>
            )}
          />
          <LocalizedTextarea
            id={`${prefix}-note`}
            label="Примечание"
            rows={2}
            value={block.note ?? noText()}
            onChange={(note) => update({ ...block, note })}
          />
        </>
      )}
    </OptionalSection>
  );
}
