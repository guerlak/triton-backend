export interface EventHero {
  backgroundImage: string;
  logoImage: string;
}

export interface POI {
  icon: string;
  title: string;
  desc: string;
}

export interface LogisticItem {
  icon: string;
  title: string;
  detail: string;
  sub: string;
  color: string;
}

export interface ResortInfo {
  image: string;
  title: string;
  description: string;
  benefits: string[];
  buttonText: string;
  whatsappLink: string;
}

export interface ScheduleEvent {
  time?: string;
  title: string;
  description?: string;
  location?: string;
  isCutoff?: boolean;
  details?: { label: string; value: string }[];
}

export interface ScheduleDay {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  events: ScheduleEvent[];
}

export interface EventFormatDetail {
  day: string;
  date: string;
  startTime: string;
  image?: string | null;
  video?: string | null;
  title: string;
  description: string;
  distances: { label: string; val: string; p: number }[];
  stravaIds?: { sprint: string; middle: string; long: string };
  stravaId?: string;
  details?: string[];
  extraDescription?: string;
}

export interface AthleteArea {
  liveResultsUrl?: string;
  raceGuideLink?: string;
  startListApiUrl?: string;
  mediaPictureUrl?: string;
  videoBriefingUrl?: string;
  liveResultsApiUrl?: string;
  topFiveApiUrl?: string;
}

export interface TestimonialProps {
  quote: string;
  author: string;
  role?: string;
  company: string;
  avatarUrl?: string;
  avatar_url?: string;
  linkSocial?: string;
  link_social?: string;
}

export interface EventData {
  id: string;
  slug: string;
  language: "pt-BR" | "en";
  eventFormat: "triton1" | "triton3";
  title: string;
  subtitle: string;
  location: string;
  venue: string;
  dateText: string;
  fullDateText: string;
  targetDate: string;
  hero: EventHero;
  athleteArea?: AthleteArea;
  liveResultsUrl?: string;
  startListApiUrl?: string;
  athleteResultsUrl?: string;
  mediaPictureUrl?: string;
  raceGuideLink?: string;
  registrationLink: string;
  isEventOn?: boolean;
  isRegistrationClosed?: boolean;
  registrationStatus?: "Open" | "Closed" | "Hold";
  country: string;
  flag: string;
  status: "Confirmed" | "Planned" | "Completed";
  eventStatus?: "Confirmed" | "Planned" | "Completed";
  year: number;
  extraEvent?: {
    imageSrc: string;
    imageAlt: string;
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    badge: string;
  };
  info?: {
    title: string;
    subtitle: string;
    description: string;
  };
  scoring?: {
    title: string;
    description: string;
  };
  schedule?: {
    title: string;
    subtitle: string;
    days: ScheduleDay[];
    importantNote: string;
  };
  formats?: {
    swim?: EventFormatDetail;
    bike?: EventFormatDetail;
    run?: EventFormatDetail;
    distanceTable?: Array<{
      name: string;
      swim: string;
      bike: string;
      run: string;
    }>;
    disableMixMatch?: boolean;
  };
  locations?: {
    description: string;
    experience?: {
      image: string;
      pois: POI[];
    };
    logistics?: LogisticItem[];
    resort?: ResortInfo;
  };
  testimonial?: {
    testimonials: TestimonialProps[];
    youtubeSrc: string;
  };
  partners?: Array<{
    name: string;
    logo: string;
    url: string;
  }>;
  afterMovie?: {
    youtubeSrc: string;
  };
}

export interface EventFilterQuery {
  eventFormat?: "triton1" | "triton3";
  year?: number;
  status?: "Confirmed" | "Planned" | "Completed";
  language?: "pt-BR" | "en";
  search?: string;
}

