require 'csv'
require 'date'
require_relative 'country_data'
require_relative 'outbreak_data'

class BorderingData
	attr_accessor :after, :exact

	def initialize(all_dates, specific_date)
		# Find data lines before and after the date
		@after = all_dates.index { |date| date >= specific_date }
		puts "Warning: BorderingDate: date #{specific_date} is out of bounds" unless @after
		@after = all_dates.length - 1 unless @after
		# raise "BorderingDate: date #{specific_date} is out of bounds" unless after
		@exact = @after if all_dates[@after] == specific_date

		raise "BorderingDate: date #{specific_date} is out of bounds" if (after < 1)
	end

	def interpolate(date, ebola_data)
		if exact
			return [date] + ebola_data.line(exact)
		end

		prior_date = ebola_data.dates[after - 1]
		after_date = ebola_data.dates[after]
		s = interpolant(date, prior_date, after_date)

		line1 = ebola_data.line(after - 1)
		line2 = ebola_data.line(after)
		[date] + line1.zip(line2).map do |first_field, second_field|
			linear_interpolate(first_field, second_field, s)
		end
	end

	private

	def interpolant(date, prior, after)
		d = Date.parse(date, '%y-%m-%d')
		p = Date.parse(prior, '%y-%m-%d')
		a = Date.parse(after, '%y-%m-%d')

		interp = 1.0 - (a - d).to_f / (a - p).to_f
		if (interp < 0.0 || interp > 1.0)
			puts "bad interpolant #{interp} for dates prior=#{p}, after=#{a}, specific=#{d}"
			interp = (interp < 0) ? 0 : 1.0
		end
		interp
	end

	# linear interpolate between x and y
	def linear_interpolate(x, y, s)
		x + (y - x) * s
	end
end

class EbolaData
	attr_accessor :countries, :sorted_names

	def initialize()
		@countries = {}
		@dates = {}
	end

	def dates
		@dates.keys.sort
	end

	def dates_hash(dates_array)
		dates_array.inject({}) { |memo, date| memo[date] = true; memo }
	end

	def add_country(country_data)
		if (@dates.empty?)
			@dates = dates_hash(country_data.dates)
		else
			@dates.merge!(dates_hash(country_data.dates))
		end
		raise "bad data for #{country_data.name}" if dates.include? nil

		merge_in_country_data(country_data)
	end

	def merge_in_country_data(country_data)
		if (@countries.has_key?(country_data.name))
			@countries[country_data.name].merge_data(country_data)
		else
			@countries[country_data.name] = country_data
		end
	end

	def line(index)
		@sorted_countries.map { |country_name| countries[country_name].data[index].to_f }
	end

	def header
		['Date'] + @sorted_countries
	end

	def normalize_data
		@countries.values.each { |country_data| country_data.normalize_data }
	end

	def write_csv(outbreak_data)
		# @countries['430'].data.each_with_index do |data, index|
		# 	puts "#{@countries['430'].dates[index]}: #{index} #{data}"
		# end
		# @countries['76'].data.each_with_index do |data, index|
		# 	puts "#{@countries['76'].dates[index]}: #{index} #{data}"
		# end

		@sorted_countries = countries.keys.sort
		CSV.open("outputs/ebola_results.csv", 'w') do |writer|
			writer << header
			outbreak_data.dates.each_with_index do |date, index|
				writer << BorderingData.new(dates, date).interpolate(date, self)
			end
		end
	end
end
