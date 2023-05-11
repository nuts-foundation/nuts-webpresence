import { useEffect, useRef, useState } from "react"

const MAX_ANIMATION_TIME = 28 * 1000

interface Props {
  items: React.ReactChild[];
}

export default function Carousel({ items }: Props) {
  const div = useRef(null)
  const [scroller, setScroller] = useState<Scroller | null>(null)

  useEffect(() => {
    const s = new Scroller(div)
    s.start()

    setScroller(s)

    return () => {
      s.stop()
    }
  }, [])

  function mouseEnter(e: React.MouseEvent) {
    scroller && scroller.pause()
  }

  function mouseLeave(e: React.MouseEvent) {
    scroller && scroller.start()
  }

  return (<div
    ref={div}
    onMouseEnter={mouseEnter}
    onMouseLeave={mouseLeave}
    className="h-full w-full overflow-hidden">
    <div className="flex flex-nowrap h-full w-[1500px]">
      {items.map((item, i) => (<div className="mr-20 h-full shrink-0" key={i}>
        {item}
      </div>))}
    </div>
  </div>)
}

class Scroller {
  ref: any;
  startedAt: Date;
  stopped: boolean;
  reversed: boolean;
  stoppedAt: number | null;

  constructor(ref: any) {
    this.ref = ref
    this.stopped = false
    this.reversed = false
    this.stoppedAt = null
    this.startedAt = new Date()
  }

  start() {
    if (this.stoppedAt) {
      this.startedAt = new Date(new Date().getTime() - (MAX_ANIMATION_TIME * this.stoppedAt))
      this.stoppedAt = null
      this.stopped = false
    }

    requestAnimationFrame(this.paint.bind(this))
  }

  progress() {
    const delta = new Date().getTime() - this.startedAt.getTime()
    return delta / MAX_ANIMATION_TIME
  }

  paint() {
    if (this.stopped) {
      return
    }

    let progress = this.progress()

    if (progress >= .99) {
      this.reversed = !this.reversed
      this.startedAt = new Date()

      progress = this.progress()

      console.log(`animation done, reversed=${this.reversed}`)
    }

    if (this.ref.current) {
      this.ref.current.scrollLeft = this.ref.current.scrollWidth * (this.reversed ? (1 - progress) : progress)
    }

    requestAnimationFrame(this.paint.bind(this))
  }

  pause() {
    this.stoppedAt = this.progress()
    this.stopped = true
  }

  stop() {
    this.stopped = true
  }
}
