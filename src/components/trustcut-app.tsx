"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  AtSign,
  BadgeCheck,
  BarChart3,
  Check,
  Clock,
  Database,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { AuthPanel } from "@/components/auth-panel";
import { GeoVerification } from "@/components/geo-verification";
import { TrustCutLogo } from "@/components/trustcut-logo";
import type { Language, Translation } from "@/lib/i18n";
import { languageOptions, translations } from "@/lib/i18n";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/browser";
import type {
  AdminSeed,
  AuthIdentity,
  Hairdresser,
  HairdresserComment,
  HairStylePost,
  Member,
} from "@/lib/types";
import { averageScore, cn, formatShortDate, maskTrustCutId, normalizeSearch } from "@/lib/utils";

type ViewId = "directory" | "styles" | "comments" | "admin";

type TrustCutAppProps = {
  initialHairdressers: Hairdresser[];
  adminSeed: AdminSeed;
  initialIdentity: AuthIdentity | null;
};

type NewMemberForm = {
  name: string;
  salonName: string;
  email: string;
};

type NewStyleForm = {
  hairdresserId: string;
  title: string;
  description: string;
  imageUrl: string;
};

const navItems: Array<{ id: ViewId; labelKey: keyof Translation; icon: typeof Search }> = [
  { id: "directory", labelKey: "navDirectory", icon: Search },
  { id: "styles", labelKey: "navStyles", icon: ImagePlus },
  { id: "comments", labelKey: "navComments", icon: MessageSquare },
  { id: "admin", labelKey: "navAdmin", icon: BarChart3 },
];

export function TrustCutApp({ initialHairdressers, adminSeed, initialIdentity }: TrustCutAppProps) {
  const [activeView, setActiveView] = useState<ViewId>("directory");
  const [language, setLanguage] = useState<Language>("en");
  const [oauthAuthenticated, setOauthAuthenticated] = useState(
    !isSupabaseBrowserConfigured() || Boolean(initialIdentity),
  );
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialHairdressers[0]?.id || "");
  const [commentDraft, setCommentDraft] = useState("");
  const [runtimeComments, setRuntimeComments] = useState<Record<string, HairdresserComment[]>>({});
  const [commentOverrides, setCommentOverrides] = useState<Record<string, HairdresserComment["status"]>>(
    {},
  );
  const [members, setMembers] = useState<Member[]>(adminSeed.members);
  const [newMember, setNewMember] = useState<NewMemberForm>({
    name: "",
    salonName: "",
    email: "",
  });
  const [runtimeStyles, setRuntimeStyles] = useState<Record<string, HairStylePost[]>>({});
  const [newStyle, setNewStyle] = useState<NewStyleForm>({
    hairdresserId: initialHairdressers[0]?.id || "",
    title: "",
    description: "",
    imageUrl: "",
  });

  const accessReady = oauthAuthenticated && pdpaAccepted && gpsVerified;
  const t = translations[language];
  const selectedHairdresser =
    initialHairdressers.find((hairdresser) => hairdresser.id === selectedId) || initialHairdressers[0];

  const filteredHairdressers = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (normalizedQuery.length < 3) {
      return initialHairdressers;
    }

    return initialHairdressers.filter((hairdresser) =>
      [
        hairdresser.trustCutId,
        hairdresser.firstName,
        hairdresser.lastName,
        hairdresser.nickName,
        hairdresser.phone,
        hairdresser.email,
        hairdresser.lineId,
        hairdresser.instagram,
        hairdresser.hometownAddress,
        hairdresser.currentAddress,
        ...hairdresser.specialties,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [initialHairdressers, query]);

  const commentsByHairdresser = useMemo(() => {
    return Object.fromEntries(
      initialHairdressers.map((hairdresser) => [
        hairdresser.id,
        [...hairdresser.comments, ...(runtimeComments[hairdresser.id] || [])].map((comment) => ({
          ...comment,
          status: commentOverrides[comment.id] || comment.status,
        })),
      ]),
    ) as Record<string, HairdresserComment[]>;
  }, [commentOverrides, initialHairdressers, runtimeComments]);

  const allStylePosts = useMemo(() => {
    return initialHairdressers
      .flatMap((hairdresser) =>
        [...hairdresser.styles, ...(runtimeStyles[hairdresser.id] || [])].map((style) => ({
          ...style,
          hairdresserName: `${hairdresser.firstName} "${hairdresser.nickName}" ${hairdresser.lastName}`,
          hairdresserId: hairdresser.id,
        })),
      )
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  }, [initialHairdressers, runtimeStyles]);

  const pendingComments = useMemo(() => {
    return initialHairdressers.flatMap((hairdresser) =>
      (commentsByHairdresser[hairdresser.id] || [])
        .filter((comment) => comment.status === "pending")
        .map((comment) => ({
          ...comment,
          hairdresserName: `${hairdresser.firstName} ${hairdresser.lastName}`,
          hairdresserId: hairdresser.id,
        })),
    );
  }, [commentsByHairdresser, initialHairdressers]);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHairdresser || !commentDraft.trim() || !accessReady) {
      return;
    }

    const nextComment: HairdresserComment = {
      id: `local-${Date.now()}`,
      authorName: "Demo Owner",
      salonName: "TrustCut Demo Salon",
      body: commentDraft.trim(),
      rating: 4,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setRuntimeComments((current) => ({
      ...current,
      [selectedHairdresser.id]: [...(current[selectedHairdresser.id] || []), nextComment],
    }));
    setCommentDraft("");
    setActiveView("comments");
  }

  function submitStyle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStyle.hairdresserId || !newStyle.title.trim() || !accessReady) {
      return;
    }

    const style: HairStylePost = {
      id: `style-${Date.now()}`,
      title: newStyle.title.trim(),
      description: newStyle.description.trim() || "Member-posted style update.",
      imageUrl: newStyle.imageUrl.trim() || "/styles/member-post.svg",
      postedBy: "Demo Member",
      createdAt: new Date().toISOString(),
    };

    setRuntimeStyles((current) => ({
      ...current,
      [newStyle.hairdresserId]: [...(current[newStyle.hairdresserId] || []), style],
    }));
    setNewStyle({
      hairdresserId: newStyle.hairdresserId,
      title: "",
      description: "",
      imageUrl: "",
    });
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMember.name.trim() || !newMember.email.trim()) {
      return;
    }

    setMembers((current) => [
      {
        id: `member-${Date.now()}`,
        name: newMember.name.trim(),
        salonName: newMember.salonName.trim() || "New salon",
        email: newMember.email.trim(),
        role: "owner",
        status: "pending",
        lastGpsCheck: new Date().toISOString(),
      },
      ...current,
    ]);
    setNewMember({ name: "", salonName: "", email: "" });
  }

  function updateMemberStatus(memberId: string, status: Member["status"]) {
    setMembers((current) =>
      current.map((member) => (member.id === memberId ? { ...member, status } : member)),
    );
  }

  function deleteMember(memberId: string) {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  }

  function moderateComment(commentId: string, status: HairdresserComment["status"]) {
    setCommentOverrides((current) => ({
      ...current,
      [commentId]: status,
    }));
  }

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#18211f]">
      <header className="border-b border-[#dbe3df] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TrustCutLogo />
            <div className="grid grid-cols-2 gap-2 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 border px-3 text-sm font-semibold transition",
                      activeView === item.id
                        ? "border-[#18211f] bg-[#18211f] text-white"
                        : "border-[#dbe3df] bg-white text-[#33413d] hover:border-[#158f7a]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {t[item.labelKey]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="border border-[#dbe3df] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 border border-[#cfe8df] bg-[#e9f7f2] px-2 py-1 text-xs font-semibold text-[#0f6c5d]">
                  <Database className="h-3.5 w-3.5" aria-hidden />
                  {t.heroBadge}
                </div>
                <h1 className="mt-4 max-w-2xl text-2xl font-semibold tracking-normal text-[#18211f] md:text-3xl">
                  {t.heroTitle}
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:min-w-[420px]">
                <Metric label={t.candidates} value={String(initialHairdressers.length)} />
                <Metric label={t.members} value={String(members.length)} />
                <Metric label={t.pending} value={String(pendingComments.length)} />
                <Metric label={t.gps} value={gpsVerified ? t.pass : t.wait} />
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <AuthPanel
              language={language}
              initialIdentity={initialIdentity}
              pdpaAccepted={pdpaAccepted}
              onAuthenticatedChange={setOauthAuthenticated}
              onPdpaChange={setPdpaAccepted}
            />
            <GeoVerification language={language} onVerifiedChange={setGpsVerified} />
          </div>
        </section>

        {!accessReady && (
          <AccessNotice
            t={t}
            oauthAuthenticated={oauthAuthenticated}
            pdpaAccepted={pdpaAccepted}
            gpsVerified={gpsVerified}
          />
        )}

        {activeView === "directory" && (
          <DirectoryView
            accessReady={accessReady}
            hairdressers={filteredHairdressers}
            query={query}
            onQueryChange={setQuery}
            selectedHairdresser={selectedHairdresser}
            onSelect={setSelectedId}
            comments={commentsByHairdresser[selectedHairdresser.id] || []}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
            onSubmitComment={submitComment}
            t={t}
          />
        )}

        {activeView === "styles" && (
          <StylesView
            accessReady={accessReady}
            posts={allStylePosts}
            hairdressers={initialHairdressers}
            form={newStyle}
            onFormChange={setNewStyle}
            onSubmit={submitStyle}
            t={t}
          />
        )}

        {activeView === "comments" && (
          <CommentsView
            accessReady={accessReady}
            pendingComments={pendingComments}
            allComments={commentsByHairdresser}
            hairdressers={initialHairdressers}
            onModerate={moderateComment}
            t={t}
          />
        )}

        {activeView === "admin" && (
          <AdminView
            accessReady={accessReady}
            members={members}
            stats={adminSeed.usageStats}
            pendingComments={pendingComments}
            newMember={newMember}
            onNewMemberChange={setNewMember}
            onAddMember={addMember}
            onUpdateMemberStatus={updateMemberStatus}
            onDeleteMember={deleteMember}
            onModerate={moderateComment}
            t={t}
          />
        )}
      </main>
      <LanguageFooter language={language} onLanguageChange={setLanguage} t={t} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e2e8e5] bg-[#fbfcfb] px-3 py-2">
      <div className="text-lg font-semibold text-[#18211f]">{value}</div>
      <div className="text-xs text-[#6c7772]">{label}</div>
    </div>
  );
}

function LanguageFooter({
  language,
  onLanguageChange,
  t,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: Translation;
}) {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 pb-8 pt-2 lg:px-6">
      <div className="flex flex-col gap-3 border border-[#dbe3df] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18211f]">{t.languageTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[#6c7772]">{t.languageHelp}</p>
        </div>
        <div className="inline-grid grid-cols-2 gap-1 border border-[#dbe3df] bg-[#f5f7f4] p-1">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => onLanguageChange(option.code)}
              className={cn(
                "h-10 px-4 text-sm font-semibold transition",
                language === option.code
                  ? "bg-[#18211f] text-white"
                  : "bg-transparent text-[#33413d] hover:bg-white",
              )}
              aria-pressed={language === option.code}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

function AccessNotice({
  t,
  oauthAuthenticated,
  pdpaAccepted,
  gpsVerified,
}: {
  t: Translation;
  oauthAuthenticated: boolean;
  pdpaAccepted: boolean;
  gpsVerified: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 border border-[#e9c6b8] bg-[#fff7f2] p-4 text-sm text-[#653523] md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 text-[#c44e35]" aria-hidden />
        <div>
          <p className="font-semibold">{t.protectedTitle}</p>
          <p className="mt-1 text-xs leading-5">
            {t.required} {t.googleOauth} {oauthAuthenticated ? t.signedIn : t.notSignedIn},{" "}
            {t.pdpaConsent} {pdpaAccepted ? t.accepted : t.notAccepted} {t.andGps}{" "}
            {gpsVerified ? t.verified : t.notVerified}.
          </p>
        </div>
      </div>
      <ShieldAlert className="hidden h-6 w-6 text-[#c44e35] md:block" aria-hidden />
    </section>
  );
}

function DirectoryView({
  accessReady,
  hairdressers,
  query,
  onQueryChange,
  selectedHairdresser,
  onSelect,
  comments,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  t,
}: {
  accessReady: boolean;
  hairdressers: Hairdresser[];
  query: string;
  onQueryChange: (query: string) => void;
  selectedHairdresser: Hairdresser;
  onSelect: (id: string) => void;
  comments: HairdresserComment[];
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  t: Translation;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="border border-[#dbe3df] bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold text-[#18211f]" htmlFor="hairdresser-search">
          {t.searchHairdresser}
        </label>
        <div className="mt-2 flex items-center border border-[#cfd9d4] bg-white px-3">
          <Search className="h-4 w-4 text-[#6c7772]" aria-hidden />
          <input
            id="hairdresser-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            disabled={!accessReady}
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none disabled:cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-xs text-[#6c7772]">{t.searchHelp}</p>

        <div className="mt-4 grid gap-3">
          {accessReady ? (
            hairdressers.map((hairdresser) => (
              <button
                key={hairdresser.id}
                type="button"
                onClick={() => onSelect(hairdresser.id)}
                className={cn(
                  "grid grid-cols-[64px_1fr] gap-3 border p-2 text-left transition",
                  selectedHairdresser.id === hairdresser.id
                    ? "border-[#158f7a] bg-[#eef8f5]"
                    : "border-[#e2e8e5] bg-white hover:border-[#7ebcad]",
                )}
              >
                <Image
                  src={hairdresser.photos[0]}
                  alt={`${hairdresser.firstName} ${hairdresser.lastName}`}
                  width={64}
                  height={72}
                  className="h-[72px] w-16 object-cover"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#18211f]">
                    {`${hairdresser.firstName} "${hairdresser.nickName}" ${hairdresser.lastName}`}
                  </span>
                  <span className="mt-1 block text-xs text-[#6c7772]">
                    {maskTrustCutId(hairdresser.trustCutId)}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {hairdresser.specialties.slice(0, 2).map((specialty) => (
                      <span
                        key={specialty}
                        className="border border-[#e2e8e5] px-1.5 py-0.5 text-[11px] text-[#33413d]"
                      >
                        {specialty}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <LockedListPreview />
          )}
        </div>
      </div>

      <div>
        {accessReady ? (
          <HairdresserProfile
            hairdresser={selectedHairdresser}
            comments={comments}
            commentDraft={commentDraft}
            onCommentDraftChange={onCommentDraftChange}
            onSubmitComment={onSubmitComment}
            t={t}
          />
        ) : (
          <LockedDataPanel title={t.hairdresserLocked} description={t.lockedDescription} />
        )}
      </div>
    </section>
  );
}

function LockedListPreview() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[64px_1fr] gap-3 border border-[#e2e8e5] p-2">
          <div className="h-[72px] w-16 bg-[#eef3f1]" />
          <div className="space-y-2 py-2">
            <div className="h-3 w-3/4 bg-[#dbe3df]" />
            <div className="h-3 w-1/2 bg-[#e8eeeb]" />
            <div className="flex gap-2 pt-2">
              <div className="h-5 w-16 bg-[#eef3f1]" />
              <div className="h-5 w-20 bg-[#eef3f1]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LockedDataPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="grid min-h-[420px] place-items-center border border-[#dbe3df] bg-white p-6 text-center shadow-sm">
      <div className="max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center border border-[#e9c6b8] bg-[#fff7f2]">
          <LockKeyhole className="h-6 w-6 text-[#c44e35]" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#18211f]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6c7772]">{description}</p>
      </div>
    </section>
  );
}

function HairdresserProfile({
  hairdresser,
  comments,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  t,
}: {
  hairdresser: Hairdresser;
  comments: HairdresserComment[];
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  t: Translation;
}) {
  const radarData = hairdresser.competency.map((point, index) => ({
    metric: point.label,
    competency: point.score,
    aptitude: hairdresser.aptitude[index]?.score || 0,
  }));

  return (
    <article className="grid gap-5">
      <section className="grid gap-5 border border-[#dbe3df] bg-white p-5 shadow-sm xl:grid-cols-[280px_1fr]">
        <div>
          <Image
            src={hairdresser.photos[0]}
            alt={`${hairdresser.firstName} ${hairdresser.lastName}`}
            width={280}
            height={340}
            className="h-[340px] w-full object-cover"
            priority
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ScoreBox label={t.behavior} value={hairdresser.behaviorScore} />
            <ScoreBox label={t.reliability} value={hairdresser.reliabilityScore} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#158f7a]">
                {maskTrustCutId(hairdresser.trustCutId)}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#18211f]">
                {`${hairdresser.firstName} "${hairdresser.nickName}" ${hairdresser.lastName}`}
              </h2>
              <p className="mt-2 text-sm text-[#6c7772]">
                {hairdresser.yearsExperience} {t.yearsExperience} - {hairdresser.specialties.join(", ")}
              </p>
            </div>
            <Image
              src={hairdresser.idPhoto}
              alt={`${hairdresser.firstName} ID card`}
              width={128}
              height={82}
              className="h-[82px] w-32 border border-[#dbe3df] object-cover"
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Fact icon={MapPin} label={t.hometown} value={hairdresser.hometownAddress} />
            <Fact icon={MapPin} label={t.current} value={hairdresser.currentAddress} />
            <Fact icon={Phone} label={t.phone} value={hairdresser.phone} />
            <Fact icon={Mail} label={t.email} value={hairdresser.email} />
            <Fact icon={AtSign} label="LINE" value={hairdresser.lineId} />
            <Fact icon={AtSign} label="Instagram" value={hairdresser.instagram} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <TextList title={t.workHistory} items={hairdresser.workHistory} />
            <TextList title={t.certificates} items={hairdresser.certificates} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <BadgeCheck className="h-4 w-4 text-[#158f7a]" aria-hidden />
            <span>{t.pdpaAccepted} {formatShortDate(hairdresser.pdpaAcceptedAt)}</span>
            <Clock className="ml-2 h-4 w-4 text-[#158f7a]" aria-hidden />
            <span>{t.lastVerified} {formatShortDate(hairdresser.lastVerifiedAt)}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="border border-[#dbe3df] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#18211f]">
                {t.radarTitle}
              </h3>
              <p className="mt-1 text-xs text-[#6c7772]">
                {t.competencyAvg} {averageScore(hairdresser.competency)} - {t.aptitudeAvg}{" "}
                {averageScore(hairdresser.aptitude)}
              </p>
            </div>
            <Activity className="h-5 w-5 text-[#158f7a]" aria-hidden />
          </div>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#cfd9d4" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#33413d", fontSize: 12 }} />
                <Tooltip />
                <Radar
                  name={t.competencyAvg}
                  dataKey="competency"
                  stroke="#158f7a"
                  fill="#158f7a"
                  fillOpacity={0.22}
                />
                <Radar
                  name={t.aptitudeAvg}
                  dataKey="aptitude"
                  stroke="#c44e35"
                  fill="#c44e35"
                  fillOpacity={0.16}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-[#dbe3df] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#18211f]">{t.comments}</h3>
          <div className="mt-4 grid gap-3">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} t={t} />
            ))}
          </div>
          <form onSubmit={onSubmitComment} className="mt-4 grid gap-2">
            <textarea
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder={t.commentPlaceholder}
              className="min-h-24 resize-none border border-[#cfd9d4] p-3 text-sm outline-none transition focus:border-[#158f7a]"
            />
            <button
              type="submit"
              disabled={!commentDraft.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 border border-[#18211f] bg-[#18211f] px-3 text-sm font-semibold text-white transition hover:bg-[#293631] disabled:cursor-not-allowed disabled:border-[#d5ddd9] disabled:bg-[#eef3f1] disabled:text-[#8a9691]"
            >
              <Send className="h-4 w-4" aria-hidden />
              {t.submitPendingComment}
            </button>
          </form>
        </div>
      </section>
    </article>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#e2e8e5] bg-[#fbfcfb] p-3">
      <div className="text-2xl font-semibold text-[#18211f]">{value}</div>
      <div className="text-xs text-[#6c7772]">{label}</div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 border border-[#e2e8e5] bg-[#fbfcfb] p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#158f7a]" aria-hidden />
      <div className="min-w-0">
        <div className="text-xs text-[#6c7772]">{label}</div>
        <div className="truncate text-sm font-medium text-[#18211f]">{value}</div>
      </div>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-[#e2e8e5] bg-[#fbfcfb] p-3">
      <h4 className="text-sm font-semibold text-[#18211f]">{title}</h4>
      <ul className="mt-2 grid gap-1 text-sm leading-6 text-[#33413d]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CommentItem({ comment, t }: { comment: HairdresserComment; t: Translation }) {
  return (
    <div className="border border-[#e2e8e5] bg-[#fbfcfb] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#18211f]">{comment.authorName}</div>
          <div className="text-xs text-[#6c7772]">{comment.salonName}</div>
        </div>
        <StatusBadge status={comment.status} t={t} />
      </div>
      <div className="mt-2 flex gap-0.5 text-[#d58a22]" aria-label={`${comment.rating} stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn("h-3.5 w-3.5", index < comment.rating ? "fill-current" : "opacity-25")}
          />
        ))}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#33413d]">{comment.body}</p>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: HairdresserComment["status"] | Member["status"];
  t: Translation;
}) {
  const statusLabel =
    status === "approved"
      ? t.approved
      : status === "active"
        ? t.active
        : status === "suspended"
          ? t.suspended
          : status === "rejected"
            ? t.rejected
            : t.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-xs font-semibold capitalize",
        status === "approved" || status === "active"
          ? "border-[#bde4d9] bg-[#e9f7f2] text-[#0f6c5d]"
          : status === "pending"
            ? "border-[#f0d49d] bg-[#fff8e7] text-[#8a5b16]"
            : "border-[#f0beb0] bg-[#fff1ed] text-[#9f3d27]",
      )}
    >
      {statusLabel}
    </span>
  );
}

function StylesView({
  accessReady,
  posts,
  hairdressers,
  form,
  onFormChange,
  onSubmit,
  t,
}: {
  accessReady: boolean;
  posts: Array<HairStylePost & { hairdresserName: string; hairdresserId: string }>;
  hairdressers: Hairdresser[];
  form: NewStyleForm;
  onFormChange: (form: NewStyleForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: Translation;
}) {
  if (!accessReady) {
    return <LockedDataPanel title={t.stylesLocked} description={t.lockedDescription} />;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id} className="border border-[#dbe3df] bg-white shadow-sm">
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={420}
              height={280}
              className="h-52 w-full object-cover"
            />
            <div className="p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#158f7a]">
                {post.hairdresserName}
              </div>
              <h3 className="mt-2 text-base font-semibold text-[#18211f]">{post.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#33413d]">{post.description}</p>
              <p className="mt-3 text-xs text-[#6c7772]">{formatShortDate(post.createdAt)}</p>
            </div>
          </article>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className={cn(
          "h-fit border border-[#dbe3df] bg-white p-4 shadow-sm",
          !accessReady && "opacity-60",
        )}
      >
        <h3 className="text-base font-semibold text-[#18211f]">{t.postStyleUpdate}</h3>
        <div className="mt-4 grid gap-3">
          <select
            value={form.hairdresserId}
            onChange={(event) => onFormChange({ ...form, hairdresserId: event.target.value })}
            disabled={!accessReady}
            className="border border-[#cfd9d4] bg-white px-3 py-2 text-sm outline-none focus:border-[#158f7a]"
          >
            {hairdressers.map((hairdresser) => (
              <option key={hairdresser.id} value={hairdresser.id}>
                {hairdresser.firstName} {hairdresser.lastName}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) => onFormChange({ ...form, title: event.target.value })}
            disabled={!accessReady}
            placeholder={t.styleTitlePlaceholder}
            className="border border-[#cfd9d4] px-3 py-2 text-sm outline-none focus:border-[#158f7a]"
          />
          <textarea
            value={form.description}
            onChange={(event) => onFormChange({ ...form, description: event.target.value })}
            disabled={!accessReady}
            placeholder={t.styleDescriptionPlaceholder}
            className="min-h-24 resize-none border border-[#cfd9d4] p-3 text-sm outline-none focus:border-[#158f7a]"
          />
          <input
            value={form.imageUrl}
            onChange={(event) => onFormChange({ ...form, imageUrl: event.target.value })}
            disabled={!accessReady}
            placeholder="/styles/member-post.svg"
            className="border border-[#cfd9d4] px-3 py-2 text-sm outline-none focus:border-[#158f7a]"
          />
          <button
            type="submit"
            disabled={!accessReady || !form.title.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 border border-[#18211f] bg-[#18211f] px-3 text-sm font-semibold text-white transition hover:bg-[#293631] disabled:cursor-not-allowed disabled:border-[#d5ddd9] disabled:bg-[#eef3f1] disabled:text-[#8a9691]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.publish}
          </button>
        </div>
      </form>
    </section>
  );
}

function CommentsView({
  accessReady,
  pendingComments,
  allComments,
  hairdressers,
  onModerate,
  t,
}: {
  accessReady: boolean;
  pendingComments: Array<HairdresserComment & { hairdresserName: string; hairdresserId: string }>;
  allComments: Record<string, HairdresserComment[]>;
  hairdressers: Hairdresser[];
  onModerate: (commentId: string, status: HairdresserComment["status"]) => void;
  t: Translation;
}) {
  if (!accessReady) {
    return <LockedDataPanel title={t.commentsLocked} description={t.lockedDescription} />;
  }

  const comments = hairdressers.flatMap((hairdresser) =>
    (allComments[hairdresser.id] || []).map((comment) => ({
      ...comment,
      hairdresserName: `${hairdresser.firstName} ${hairdresser.lastName}`,
    })),
  );

  return (
    <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="border border-[#dbe3df] bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-[#18211f]">{t.pendingApproval}</h3>
        <p className="mt-1 text-sm text-[#6c7772]">
          {pendingComments.length} {t.commentsWaiting}
        </p>
        <div className="mt-4 grid gap-3">
          {pendingComments.map((comment) => (
            <div key={comment.id} className="border border-[#e2e8e5] bg-[#fbfcfb] p-3">
              <div className="text-sm font-semibold text-[#18211f]">{comment.hairdresserName}</div>
              <p className="mt-2 text-sm leading-6 text-[#33413d]">{comment.body}</p>
              <div className="mt-3 flex gap-2">
                <IconButton
                  label={t.approve}
                  icon={Check}
                  onClick={() => onModerate(comment.id, "approved")}
                />
                <IconButton
                  label={t.reject}
                  icon={X}
                  onClick={() => onModerate(comment.id, "rejected")}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {comments.map((comment) => (
          <div key={comment.id} className="border border-[#dbe3df] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#18211f]">{comment.hairdresserName}</h3>
                <p className="text-xs text-[#6c7772]">
                  {comment.authorName} - {comment.salonName} - {formatShortDate(comment.createdAt)}
                </p>
              </div>
              <StatusBadge status={comment.status} t={t} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#33413d]">{comment.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminView({
  accessReady,
  members,
  stats,
  pendingComments,
  newMember,
  onNewMemberChange,
  onAddMember,
  onUpdateMemberStatus,
  onDeleteMember,
  onModerate,
  t,
}: {
  accessReady: boolean;
  members: Member[];
  stats: AdminSeed["usageStats"];
  pendingComments: Array<HairdresserComment & { hairdresserName: string; hairdresserId: string }>;
  newMember: NewMemberForm;
  onNewMemberChange: (form: NewMemberForm) => void;
  onAddMember: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateMemberStatus: (memberId: string, status: Member["status"]) => void;
  onDeleteMember: (memberId: string) => void;
  onModerate: (commentId: string, status: HairdresserComment["status"]) => void;
  t: Translation;
}) {
  if (!accessReady) {
    return <LockedDataPanel title={t.adminLocked} description={t.lockedDescription} />;
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-[#dbe3df] bg-white p-4 shadow-sm">
            <div className="text-2xl font-semibold text-[#18211f]">{stat.value}</div>
            <div className="mt-1 text-sm font-medium text-[#33413d]">{stat.label}</div>
            <div className="mt-2 text-xs text-[#6c7772]">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="border border-[#dbe3df] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e2e8e5] p-4">
            <div>
              <h3 className="text-base font-semibold text-[#18211f]">{t.adminMembersTitle}</h3>
              <p className="mt-1 text-xs text-[#6c7772]">{t.adminMembersHelp}</p>
            </div>
            <Users className="h-5 w-5 text-[#158f7a]" aria-hidden />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[#f5f7f4] text-xs uppercase tracking-[0.08em] text-[#6c7772]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.member}</th>
                  <th className="px-4 py-3 font-semibold">{t.salon}</th>
                  <th className="px-4 py-3 font-semibold">{t.role}</th>
                  <th className="px-4 py-3 font-semibold">{t.status}</th>
                  <th className="px-4 py-3 font-semibold">{t.lastGps}</th>
                  <th className="px-4 py-3 font-semibold">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-[#e2e8e5]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#18211f]">{member.name}</div>
                      <div className="text-xs text-[#6c7772]">{member.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#33413d]">{member.salonName}</td>
                    <td className="px-4 py-3 capitalize text-[#33413d]">{member.role}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={member.status} t={t} />
                    </td>
                    <td className="px-4 py-3 text-[#33413d]">{formatShortDate(member.lastGpsCheck)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <IconButton
                          label={t.activate}
                          icon={Check}
                          onClick={() => onUpdateMemberStatus(member.id, "active")}
                        />
                        <IconButton
                          label={t.suspend}
                          icon={X}
                          onClick={() => onUpdateMemberStatus(member.id, "suspended")}
                        />
                        <IconButton
                          label={t.delete}
                          icon={Trash2}
                          onClick={() => onDeleteMember(member.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-5">
          <form onSubmit={onAddMember} className="border border-[#dbe3df] bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[#18211f]">{t.addMember}</h3>
            <div className="mt-4 grid gap-3">
              <input
                value={newMember.name}
                onChange={(event) => onNewMemberChange({ ...newMember, name: event.target.value })}
                placeholder={t.memberName}
                className="border border-[#cfd9d4] px-3 py-2 text-sm outline-none focus:border-[#158f7a]"
              />
              <input
                value={newMember.salonName}
                onChange={(event) =>
                  onNewMemberChange({ ...newMember, salonName: event.target.value })
                }
                placeholder={t.salonName}
                className="border border-[#cfd9d4] px-3 py-2 text-sm outline-none focus:border-[#158f7a]"
              />
              <input
                value={newMember.email}
                onChange={(event) => onNewMemberChange({ ...newMember, email: event.target.value })}
                placeholder="member@salon.com"
                className="border border-[#cfd9d4] px-3 py-2 text-sm outline-none focus:border-[#158f7a]"
              />
              <button
                type="submit"
                disabled={!newMember.name.trim() || !newMember.email.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 border border-[#18211f] bg-[#18211f] px-3 text-sm font-semibold text-white transition hover:bg-[#293631] disabled:cursor-not-allowed disabled:border-[#d5ddd9] disabled:bg-[#eef3f1] disabled:text-[#8a9691]"
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                {t.addPendingMember}
              </button>
            </div>
          </form>

          <div className="border border-[#dbe3df] bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[#18211f]">{t.approvalQueue}</h3>
            <div className="mt-4 grid gap-3">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="border border-[#e2e8e5] bg-[#fbfcfb] p-3">
                  <div className="text-sm font-semibold text-[#18211f]">{comment.hairdresserName}</div>
                  <p className="mt-2 text-sm leading-6 text-[#33413d]">{comment.body}</p>
                  <div className="mt-3 flex gap-2">
                    <IconButton
                      label={t.approve}
                      icon={Check}
                      onClick={() => onModerate(comment.id, "approved")}
                    />
                    <IconButton
                      label={t.reject}
                      icon={X}
                      onClick={() => onModerate(comment.id, "rejected")}
                    />
                  </div>
                </div>
              ))}
              {!pendingComments.length && (
                <p className="text-sm text-[#6c7772]">{t.noPendingComments}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Check;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center border border-[#cfd9d4] bg-white text-[#33413d] transition hover:border-[#158f7a] hover:text-[#0f6c5d]"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
