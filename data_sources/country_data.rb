class CountryData
	UNITED_STATES_COUNTRY_CODE = '840'
	attr_accessor :name, :human_name, :data, :dates, :max_usa

	def initialize(name, data, dates, human_name)
		@name = name
		@data = data
		@dates = dates
		@human_name = human_name

		if (data)
			@max_usa = @data.inject(0) { |memo, datum| memo > datum[1].to_f ? memo : datum[1].to_f }
		else
			@max_usa = 999
		end
	end

	def normalize_data
		raise "bad @max_usa" if @max_usa > 100

		@data = @data.map { |datum| datum[0].to_f / max_usa }
	end

	def data_hash
		@dates.zip(@data).inject({}) { |memo, (date, data)| memo[date] = data; memo }
	end

	def merge_data(country_data)
		if (country_data.name == UNITED_STATES_COUNTRY_CODE)
			max_value = 0
			country_data.data.each { |datum| max_value = (datum[1].to_f > max_value ? datum[1].to_f : max_value) }
			if max_value < 100
				return
			end
		end

		puts "Name mismatch: #{@name} #{country_data.name}" if @name && @name != country_data.name
		@name = country_data.name

		data1 = data_hash
		data2 = country_data.data_hash

		merged = data1.merge(data2)
		@dates = merged.keys.sort
		@data = @dates.map { |date| merged[date] }

		update_max_usa(country_data)
	end

	def data_for(specific_date)
		# Find data lines before and after the date
		@after = @dates.index { |date| date >= specific_date }
		# puts "Warning: BorderingDate: date #{specific_date} is out of bounds" unless @after
		@after = @dates.length - 1 unless @after
		# raise "BorderingDate: date #{specific_date} is out of bounds" unless after
		@exact = (@dates[@after] == specific_date) ? @after : nil

		if (@after < 1)
			# raise "CountryData: date #{specific_date} is out of bounds for country #{@name}"
			return 0
		end
		interpolate(specific_date)
	end

	def interpolate(date)
		if @exact
			return @data[@exact]
		end

		prior_date = @dates[@after - 1]
		after_date = @dates[@after]
		s = interpolant(date, prior_date, after_date)

		line1 = @data[@after - 1]
		line2 = @data[@after]
		linear_interpolate(line1, line2, s)
	end

	private


	def interpolant(date, prior, after)
		d = Date.parse(date, '%y-%m-%d')
		p = Date.parse(prior, '%y-%m-%d')
		a = Date.parse(after, '%y-%m-%d')

		interp = 1.0 - (a - d).to_f / (a - p).to_f
		if (interp < 0.0 || interp > 1.0)
			#puts "bad interpolant #{interp} for dates prior=#{p}, after=#{a}, specific=#{d}"
			interp = (interp < 0) ? 0 : interp
		end
		interp
	end

	# linear interpolate between x and y
	def linear_interpolate(x, y, s)
		return 0 if (s > 1.5) # When dates are too far out of range, just report no data.
		s = (s > 1.0) ? 1.0 : s
		x + (y - x) * s
	end	

	def update_max_usa(country_data)
		# Take the smaller value between the data sets when merging
		@max_usa = (@max_usa < country_data.max_usa) ? @max_usa : country_data.max_usa
	end
end
