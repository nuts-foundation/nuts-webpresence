interface Props {
  src: string;
}

export default function Video({ src }: Props) {
  return (<div className="rounded-lg overflow-hidden">
    <video autoPlay={true} controls={false} loop={true}>
      <source src={src} type="video/mp4" />
    </video>
  </div>);
}
